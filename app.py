from flask import Flask, jsonify, render_template, request, session, redirect, url_for, json, Response
import pymongo
from pymongo import MongoClient
from datetime import datetime, timedelta
from bson import json_util
from bson.objectid import ObjectId
from bson.errors import InvalidId
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import json
import openai
import os

import pandas as pd 
import pickle
import joblib
import re
import string
from nltk.tokenize.treebank import TreebankWordDetokenizer
import gensim
from sklearn.model_selection import train_test_split
from keras.models import Sequential
from keras import layers
from keras.optimizers import RMSprop,Adam
from keras.preprocessing.text import Tokenizer
from keras.utils import pad_sequences
from keras import regularizers
from keras import backend as K
from keras.callbacks import ModelCheckpoint
import pickle
import warnings
warnings.filterwarnings('ignore')
import tensorflow as tf
from tensorflow import keras
import numpy as np
import pandas as pd

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

        user_id = users.insert_one({
            "username": username,
            "password": hashed_password,
            "admin": True if username == 'admin' else False
        }).inserted_id
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
    posts = list(db.posts_tb.find())
    return Response(json_util.dumps({"posts_dump": posts}), mimetype='application/json')


@app.route('/users_dump')
def users_dump():
    db = get_db()
    users = list(db.users_tb.find())
    return Response(json_util.dumps({"users_dump": users}), mimetype='application/json')


@app.route('/')
def home():
    return redirect(url_for('display_feed'))

# Route for displaying the feed


@app.route('/feed')
def display_feed():
    return render_template('feed.html')


@app.route('/posts')
def fetch_posts():
    db = get_db()
    _users = db.users_tb

    user = None
    if 'user_id' in session:
        user = _users.find_one({"_id": ObjectId(session['user_id'])})

    def can_see_post(post, user):
        if not user:
            return not post['blocked']
        is_author = str(post['author']) == str(session['user_id'])
        return not post['blocked'] or is_author or user["admin"]

    def can_see_comment(comment, user):
        if not user:
            return not comment['blocked']
        is_author = str(comment['author']) == str(session['user_id'])
        return not comment['blocked'] or is_author or user["admin"]

    _posts = db.posts_tb.find().sort('date', pymongo.DESCENDING)
    posts = [
        {
            "_id": str(post['_id']),
            "title": post['title'] if can_see_post(post, user) else '',
            "content": post['content'] if can_see_post(post, user) else '',
            "author": str(post['author']),
            "date": format_date(post['date']),
            "rawdate": post['date'].timestamp(),
            "comments": [
                {
                    "content": comment['content'] if can_see_comment(comment, user) else '',
                    "author": str(comment['author']),
                    "date": format_date(comment['date']),
                    "rawdate": comment['date'].timestamp(),
                    "blocked": str(comment['blocked']),
                    "misinformation": str(comment['misinformation'])
                }
                for comment in post['comments']
            ],
            "blocked": str(post['blocked']),
            "label": str(post['label']) if can_see_post(post, user) else '',
            "misinformation": str(post['misinformation'])
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

    _users = db.users_tb

    user = None
    if 'user_id' in session:
        user = _users.find_one({"_id": ObjectId(session['user_id'])})

    post = db.posts_tb.find_one({"_id": post_object_id})

    def can_see_post(post, user):
        if not user:
            return not post['blocked']
        is_author = str(post['author']) == str(session['user_id'])
        return not post['blocked'] or is_author or user["admin"]

    def can_see_comment(comment, user):
        if not user:
            return not comment['blocked']
        is_author = str(comment['author']) == str(session['user_id'])
        return not comment['blocked'] or is_author or user["admin"]

    # Check if the post was found
    if post:
        # Convert ObjectId fields to strings and format the date
        formatted_post = {
            "_id": str(post["_id"]),
            "title": post['title'] if can_see_post(post, user) else '',
            "content": post['content'] if can_see_post(post, user) else '',
            "author": str(post["author"]),
            "date": format_date(post['date']),
            "rawdate": post['date'].timestamp(),
            "comments": [
                {
                    "content": comment['content'] if can_see_comment(comment, user) else '',
                    "author": str(comment["author"]),
                    "date": format_date(comment['date']),
                    "rawdate": comment['date'].timestamp(),
                    "blocked": str(comment["blocked"]),
                    "misinformation": str(comment['misinformation'])
                }
                for comment in post["comments"]
            ],
            "label": str(post['label']) if can_see_post(post, user) else '',
            "blocked": str(post["blocked"]),
            "misinformation": str(post['misinformation'])

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

    # Perform sentiment prediction
    title = post_data["title"]
    content = post_data["content"]
    sentiment_prediction = fake_news_det(title, content)

    new_post = {
        "title": post_data["title"],
        "content": post_data["content"],
        "author": ObjectId(session['user_id']),
        "date": datetime.utcnow(),
        "comments": [],
        "blocked": False,
        "label": sentiment_prediction,
        "misinformation": False
    }

    # filtering
    # if ("badword" in new_post["title"].lower() or "badword" in new_post["content"].lower()):
    if disallow_content_gpt(post_data["title"], post_data["content"]):
        new_post["blocked"] = True

    if misinfo_gpt(post_data["title"], post_data["content"]):
        new_post["misinformation"] = True

    db.posts_tb.insert_one(new_post)
    return jsonify({"message": "Post created successfully"}), 201

@login_required
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
    post = db.posts_tb.find_one({"_id": ObjectId(post_id)})

    comment_data = request.get_json()

    new_comment = {
        "content": comment_data["content"],
        "author": ObjectId(session['user_id']),
        "date": datetime.utcnow(),
        "blocked": False,
        "misinformation": False
    }

    # filtering
    # if ("badword" in new_comment["content"].lower()):
    if disallow_content_gpt(f'Reply to a post named "${post["title"]}"', new_comment["content"]):
        new_comment["blocked"] = True
        # return jsonify({"message": "Failed content filter"}), 400
    
    if misinfo_gpt(f'Reply to a post named "${post["title"]}"', new_comment["content"]):
        new_comment["misinformation"] = True

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
            "admin": user["admin"]
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


# URL of the API endpoint
url = "http://localhost:8100/classify"

def disallow_content_gpt(title, content):

    try:
        openai.api_key = os.environ["OPENAI_API_KEY"]
    except KeyError:
        raise Exception("OPENAI_API_KEY not set in environment")


    post_prompt = f"Please respond with 'allow' or 'disallow' concerning this forum post's content: \nTitle: ${title}\nContent: ${content}"
    system_prompt = f"You are a helpful moderator that has extensive experience moderating large community forums. You are extremely well versed in recognizing profane language, racist, homophobic and sexist behaviors as well as any potentially aggressive language or latent sentiment in a post that may be considered verbal bullying. You do not care if a post's content is true or not, only if it is offensive. The only responses you can give are 'Allow' or 'Disallow'. "
    # system_prompt = f'You are a helpful moderator that has extensive experience moderating large community forums. You are extremely well versed in recognizing profane language, racist, homophobic and sexist behaviors as well as any potentially aggressive language or latent sentiment in a post that may be considered verbal bullying. You do not care if a post's content is true or not, only if it is offensive.'
    # json_test = {
    #     "spam": False,
    #     "profanity": False,
    #     "racism": False,
    #     "sexism": False,
    #     "homophobia": False,
    #     "aggressive_language": False,
    #     "compliance": True,
    #     "passed": True
    # }

    response = openai.ChatCompletion.create(
        # model="gpt-3.5-turbo",
        model="gpt-4",
        max_tokens=4,
        temperature=0,
        messages=[{
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user", 
                "content": post_prompt
            }]
    )
    # Return the response
    return 'disallow' in response['choices'][0]['message']['content'].lower().split()[0]

def misinfo_gpt(title, content):

    try:
        openai.api_key = os.environ["OPENAI_API_KEY"]
    except KeyError:
        raise Exception("OPENAI_API_KEY not set in environment")

    post_prompt = f"Please respond with 'allow' or 'disallow' concerning this forum post's content, responding 'allow' if the subject is beyond your training knowledge: \nTitle: ${title}\nContent: ${content}"

    response = openai.ChatCompletion.create(
        # model="gpt-3.5-turbo",
        model="gpt-4",
        max_tokens=4,
        temperature=0,
        messages=[{
                "role": "system",
                "content": "You are a helpful forum moderator. You excel at differentiating genuine facts or simple mistakes from intentional disinformation. Your attention to detail allows you to spot misinformation tactics, such as manipulated context or fabricated sources. With a commitment to uphold truth and credibility, your main objective is to flag any posts as disallowed if they contain political, historical, or scientific misinformation, and allow them otherwise."
            },
            {
                "role": "user", 
                "content": post_prompt
            }]
    )
    # Return the response
    return 'disallow' in response['choices'][0]['message']['content'].lower().split()[0]

def format_date(date):
    now = datetime.now()
    diff = now - date

    if diff < timedelta(minutes=1):
        return 'Just now'
    elif diff < timedelta(hours=1):
        return f'{diff.seconds // 60} minutes ago'
    elif diff < timedelta(days=1):
        return f'Today at {date.strftime("%I:%M %p")}'
    elif diff < timedelta(days=2):
        return f'Yesterday at {date.strftime("%I:%M %p")}'
    elif now.year == date.year:
        return date.strftime("%d %B")
    else:
        return date.strftime("%d %B %Y")


# Running Fake News Detection model



def depure_data(data):

    #Removing URLs with a regular expression
    url_pattern = re.compile(r'https?://\S+|www\.\S+')
    data = url_pattern.sub(r'', data)

    # Remove Emails
    data = re.sub('\S*@\S*\s?', '', data)

    # Remove new line characters
    data = re.sub('\s+', ' ', data)

    # Remove distracting single quotes
    data = re.sub("\'", "", data)

    return data

def sent_to_words(sentences):
    for sentence in sentences:
        yield(gensim.utils.simple_preprocess(str(sentence), deacc=True))  # deacc=True removes punctuations

def detokenize(text):
    return TreebankWordDetokenizer().detokenize(text)

def fake_news_det(title, content):
    # Tokenize and preprocess the input news
    max_words = 5000
    max_len = 200

    input_data = [title, content]
    sequence = tokenizer.texts_to_sequences(input_data)
    test = pad_sequences(sequence, maxlen=max_len)
    # Make predictions using the loaded model
    prediction = ['FAKE','REAL'][np.around(load_model.predict(test), decimals=0).argmax(axis=1)[0]]

    return prediction

@app.route('/predict',methods=['POST'])
def predict():
    if request.method == 'POST':
        title = request.form.get['title']
        content = request.form.get['content']
        pred = fake_news_det(title, content)
        print('This is pred:')
        print(pred)
        return render_template('feed.html', prediction=pred)
    else:
        return render_template('feed.html', prediction="Something went wrong")
    
if __name__ == '__main__':
    load_model = keras.models.load_model("model.h5")
    print('Model loaded')
        # Load the tokenizer
    with open('tokenizer.pickle', 'rb') as handle:
        tokenizer = pickle.load(handle)
    print('Tokenizer loaded')

    app.run(host='0.0.0.0', port=5001, debug=True)
    print('App running')
    # dataframe = pd.read_csv('news.csv')

    # dataframe = dataframe[["text","label"]]
    # dataframe["text"].isnull().sum()
    # dataframe["text"].fillna("No content", inplace = True)

    # sentiment = ['FAKE','REAL']

    # data = []
    # for i in range(len(data_words)):
    #     data.append(detokenize(data_words[i]))

    # data = np.array(data)

    # labels = np.array(dataframe['label'])
    # y = []
    # for i in range(len(labels)):
    #     if labels[i] == 'FAKE':
    #         y.append(0)
    #     if labels[i] == 'REAL':
    #         y.append(1)
    # y = np.array(y)
    # labels = tf.keras.utils.to_categorical(y, 3, dtype="float32")
    # del y


    # #Data sequencing and spilting
    # max_words = 5000
    # max_len = 200

    # tokenizer = Tokenizer(num_words=max_words)
    # tokenizer.fit_on_texts(data)
    # sequences = tokenizer.texts_to_sequences(data)
    # news = pad_sequences(sequences, maxlen=max_len)
    # print(news)

    # X_train, X_test, y_train, y_test = train_test_split(news,labels, random_state=0)


    # temp = []
    # #Splitting pd.Series to list
    # data_to_list = dataframe['text'].values.tolist()
    # for i in range(len(data_to_list)):
    #     temp.append(depure_data(data_to_list[i]))

    # data_words = list(sent_to_words(temp))

    # #Model building (BidRNN)
    # model = Sequential()
    # model.add(layers.Embedding(max_words, 40, input_length=max_len))
    # model.add(layers.Bidirectional(layers.LSTM(20,dropout=0.6)))
    # model.add(layers.Dense(3,activation='softmax'))
    # model.compile(optimizer='rmsprop',loss='categorical_crossentropy', metrics=['accuracy'])
    # model.fit(X_train, y_train, epochs=70,validation_data=(X_test, y_test))
    # test_loss, test_acc = model.evaluate(X_test, y_test, verbose=2)
    # print(f'Test Loss: {test_loss:.4f}')
    # print(f'Test Accuracy: {test_acc:.4f}')

    # #Save whole model
    # model.save("model.h5")
    # load_model = keras.models.load_model("model.h5")
    # print('Model saved')
