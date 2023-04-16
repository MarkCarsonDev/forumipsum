from flask import Flask, jsonify, render_template, request
import pymongo
from pymongo import MongoClient
from datetime import datetime
from bson.json_util import dumps
from bson.objectid import ObjectId

app = Flask(__name__)

# Database connection function
def get_db():
    client = MongoClient(host='mongodb', 
                         port=27017,
                         username='root',
                         password='pass',
                         authSource='admin')
    db = client['posts_db']
    return db


@app.route('/posts_dump')
def posts_dump():
    db = get_db()
    posts = db.posts_tb.find()
    return jsonify({"post_dump": dumps(posts)})

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
            "author": post['author'],
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

@app.route('/posts/<post_id>')
def fetch_post(post_id):
    db = get_db()

    # Find the post with the given id
    post_object_id = ObjectId(post_id)
    
    post = db.posts_tb.find_one({"_id": ObjectId(post_object_id)})

    # Check if the post was found
    if post:
        # Convert ObjectId fields to strings
        post["_id"] = str(post["_id"])
        # Uncomment when authentication is implemented
        #post["author"]["userId"] = str(post["author"]["userId"])
        #for comment in post["comments"]:
            #comment["_id"] = str(comment["_id"])
            # Uncomment when authentication is implemented
            # comment["author"]["userId"] = str(comment["author"]["userId"])
            # Do the same for nested comments if needed

        # Return the JSON response
        return jsonify(post)
    else:
        # Return a 404 not found status if the post is not found
        return jsonify({"error": "Post not found"}), 404

# Route for creating a new post
@app.route('/posts/', methods=['POST'])
def create_post():
    db = get_db()
    post_data = request.get_json()
    
    new_post = {
        "title": post_data["title"],
        "content": post_data["content"],
        "author": post_data["author"],
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
def create_comment(post_id):
    db = get_db()
    comment_data = request.get_json()

    new_comment = {
        "content": comment_data["content"],
        "author": comment_data["author"],
        "date": datetime.utcnow()
    }

    # Filter content if needed

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6969, debug=True)
