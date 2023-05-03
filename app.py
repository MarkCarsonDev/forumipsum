from flask import Flask, jsonify, render_template, request, session, redirect, url_for, json
import pymongo
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson.json_util import dumps
from bson.objectid import ObjectId
from bson.errors import InvalidId
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.secret_key = 'your_secret_key'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(CustomJSONEncoder, self).default(obj)


app.json_encoder = CustomJSONEncoder


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Database connection function


def get_db():
    client = MongoClient(host='mongodb',
                         port=27017,
                         username='root',
                         password='pass',
                         authSource='admin')
    db = client['posts_db']
    return db


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        db = get_db()
        users = db.users_tb
        username = request.form.get('username')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password)

        if users.find_one({"username": username}):
            return jsonify({"error": "Username already exists"}), 400

        user_id = users.insert_one(
            {"username": username, "password": hashed_password}).inserted_id
        session['user_id'] = str(user_id)
        return redirect(url_for('display_feed'))

    return render_template('auth.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        db = get_db()
        users = db.users_tb
        username = request.form.get('username')
        password = request.form.get('password')

        user = users.find_one({"username": username})
        if user and check_password_hash(user['password'], password):
            session['user_id'] = str(user['_id'])
            return redirect(url_for('display_feed'))
        elif not user:
            return jsonify({"error": "Invalid username"}), 401
        else:
            return jsonify({"error": "Invalid password (or wrong username, oops!)"}), 401

    return render_template('auth.html')


@app.route('/logout')
@login_required
def logout():
    session.pop('user_id', None)
    return redirect(url_for('display_feed'))


@app.route('/posts_dump')
def posts_dump():
    db = get_db()
    posts = db.posts_tb.find()
    return jsonify({"post_dump": dumps(posts)})


@app.route('/users_dump')
def users_dump():
    db = get_db()
    users = db.users_tb.find()
    return jsonify({"users_dump": dumps(users)})

# Route for displaying the feed


@app.route('/feed')
def display_feed():
    return render_template('feed.html')

# Route for fetching posts


@app.route('/posts')
def fetch_posts():
    db = get_db()
    _posts = db.posts_tb.find().sort('date', pymongo.DESCENDING)
    posts = [
        {
            "_id": str(post['_id']),
            "title": post['title'],
            "content": post['content'],
            "author": str(post['author']),
            "date": post['date'].strftime("%Y-%m-%d %H:%M:%S"),
            "comments": post['comments']
        }
        for post in _posts
    ]
    return jsonify({"posts": posts})


# Route for displaying the feed
@app.route('/p/<post_id>')
def display_post(post_id):
    return render_template('post.html')

# Route for displaying the feed


@app.route('/u/<user_id>')
def display_user(user_id):
    return render_template('user.html')


@app.route('/posts/<post_id>')
def fetch_post(post_id):
    db = get_db()

    # Find the post with the given id
    try:
        post_object_id = ObjectId(post_id)
    except InvalidId:
        return jsonify({"error": "Invalid post_id"}), 400
        print("Invalid post_id")

    post = db.posts_tb.find_one({"_id": ObjectId(post_object_id)})

    # Check if the post was found
    if post:
        # Convert ObjectId fields to strings and format the date
        formatted_post = {
            "_id": str(post["_id"]),
            "title": post["title"],
            "content": post["content"],
            "author": str(post["author"]),
            "date": post["date"].strftime("%Y-%m-%d %H:%M:%S"),
            "comments": [
                {
                    "_id": str(comment["_id"]),
                    "content": comment["content"],
                    "author": str(comment["author"]),
                    "date": comment["date"].strftime("%Y-%m-%d %H:%M:%S")
                }
                for comment in post["comments"]
            ]
        }
        # Return the JSON response
        return jsonify({"post": formatted_post})
    else:
        # Return a 404 not found status if the post is not found
        return jsonify({"error": "Post not found"}), 404


# Route for creating a new post


@app.route('/posts/', methods=['POST'])
@login_required
def create_post():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    users = db.users_tb
    user = users.find_one({"_id": ObjectId(session['user_id'])})
    if not user:
        return jsonify({"error": "User not found"}), 404

    post_data = request.get_json()

    new_post = {
        "title": post_data["title"],
        "content": post_data["content"],
        "author": ObjectId(session['user_id']),
        "date": datetime.utcnow(),
        "comments": []
    }

    # filtering
    if ("badword" in new_post["title"].lower() or "badword" in new_post["content"].lower()):
        return jsonify({"message": "Failed content filter"}), 400

    db.posts_tb.insert_one(new_post)
    return jsonify({"message": "Post created successfully"}), 201


@app.route('/posts/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    db = get_db()

    # Delete the post from the database using post_id
    result = db.posts_tb.delete_one({"_id": ObjectId(post_id)})

    if result.deleted_count == 1:
        return jsonify({"message": "Post deleted successfully"}), 200
    else:
        return jsonify({"message": "Error deleting post"}), 500

# Route for creating a new comment on a post


@app.route('/posts/<post_id>/comments', methods=['POST'])
@login_required
def create_comment(post_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    db = get_db()
    users = db.users_tb
    user = users.find_one({"_id": ObjectId(session['user_id'])})
    if not user:
        return jsonify({"error": "User not found"}), 404

    comment_data = request.get_json()

    new_comment = {
        "content": comment_data["content"],
        "author": ObjectId(session['user_id']),
        "date": datetime.utcnow()
    }

    # filtering
    if ("badword" in new_comment["content"].lower()):
        return jsonify({"message": "Failed content filter"}), 400
    # call the model with the GPT sample text + banned content

    # Find the parent post and append the new comment
    result = db.posts_tb.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"comments": new_comment}}
    )

    if result.modified_count == 1:
        return jsonify({"message": "Comment created successfully"}), 201
    else:
        return jsonify({"message": "Error creating comment"}), 500

# Route for clearing all posts


@app.route('/clear_posts', methods=['POST'])
def clear_posts():
    db = get_db()
    db.posts_tb.drop()
    return jsonify({"message": "Posts cleared successfully"}), 200


@app.route('/user_info/<user_id>')
def user_info(user_id):
    db = get_db()
    users = db.users_tb
    user = users.find_one({"_id": ObjectId(user_id)})
    if user:
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
        }
        return jsonify(user_data)
    else:
        return jsonify({"error": "User not found"}), 404


@app.route('/session_info/')
def session_info():
    user_id = session.get('user_id', None)
    if not user_id:
        return jsonify({"error": "User not logged in"}), 401

    db = get_db()
    users = db.users_tb
    user = users.find_one({"_id": ObjectId(user_id)})
    if user:
        user_data = {
            "id": str(user["_id"]),
            "username": user["username"],
        }
        return jsonify(user_data)
    else:
        return jsonify({"error": "User not found"}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6969, debug=True)
