db = db.getSiblingDB("posts_db");
db.posts_tb.drop();

db.posts_tb.insertMany([
    {
        "_id": ObjectId(),
        "title": "How to create a new thread?",
        "content": "I want to create a new thread, but I don't know how to do it.",
        "author": {
            "name": "John Doe",
            "userId": ObjectId()
        },
        "date": new Date("2020-01-01"),
        "comments": [
            {
                "_id": ObjectId(),
                "content": "You can create a new thread by clicking the 'New Thread' button.",
                "author": {
                    "name": "Jane Doe",
                    "userId": ObjectId()
                },
                "date": new Date("2020-01-02"),
                "comments": [
                    {
                        "_id": ObjectId(),
                        "content": "Thanks for the help!",
                        "author": {
                            "name": "John Doe",
                            "userId": ObjectId()
                        },
                        "date": new Date("2020-01-03"),
                        "comments": [{
                            "_id": ObjectId(),
                            "content": "You're welcome!",
                            "author": {
                                "name": "Jane Doe",
                                "userId": ObjectId()
                            },
                            "date": new Date("2020-01-02"),
                            "comments": []
                        }] // Infinitely nested comments can be added here
                    }
                ]
            }
        ]
    },
    // ... other posts ...
]);

