db = db.getSiblingDB("posts_db");
db.posts_tb.drop();

db.posts_tb.insertMany([
    {
        "_id": "643d2ddfa8198da8bd78eb64",
        "author": "Professor Zukunft",
        "comments": [
            {
                "author": "Mark",
                "content": "Glad to have you here!",
                "date": "Mon, 17 Apr 2023 11:30:54 GMT"
            }
        ],
        "content": "I'm glad to be here :)",
        "date": "2023-04-17 11:30:39",
        "title": "Hello everyone!"
    },
    {
        "_id": "643d213b9c98b492ffcc5642",
        "author": "Jeff",
        "comments": [],
        "content": "bruh bruh bruh bruh",
        "date": "2023-04-17 10:36:43",
        "title": "Nw post"
    },
    {
        "_id": "642ad5c32361f4eb2e2ec1f8",
        "author": "Biased_reviewer_69",
        "comments": [
            {
                "author": "Mark",
                "content": "Thans lol",
                "date": "Sun, 16 Apr 2023 21:43:45 GMT"
            },
            {
                "author": "Bad boy",
                "content": "hey watch me badword",
                "date": "Mon, 17 Apr 2023 10:02:13 GMT"
            },
            {
                "author": "bad boy v2",
                "content": "AHA, NOW WATCH THIS! BADWOR",
                "date": "Mon, 17 Apr 2023 10:03:46 GMT"
            },
            {
                "author": "mark",
                "content": "I am leaving a comment!",
                "date": "Mon, 17 Apr 2023 10:36:15 GMT"
            },
            {
                "author": "Minh",
                "content": "hello world!",
                "date": "Mon, 17 Apr 2023 10:50:46 GMT"
            },
            {
                "author": "Check this out",
                "content": "Hello <a href=\"https://google.com\">google</a>",
                "date": "Mon, 17 Apr 2023 10:52:35 GMT"
            }
        ],
        "content": "Using masonry.js for this is really smart broh... good job",
        "date": "2023-04-03 13:33:55",
        "title": "Nice post stacking"
    },
    {
        "_id": "642ad59e2361f4eb2e2ec1f5",
        "author": "Johnny",
        "comments": [],
        "content": "Ipsum dolores???? SIT AMET!! then the mfer said something like \"consectetur\" and I was like \"broh, adipisicing elit. (AT LEAST), maxime mollitia, molestiae quas vel isint!\". smhhh.",
        "date": "2023-04-03 13:33:18",
        "title": "Lorum something!"
    },
    {
        "_id": "642ad5732361f4eb2e2ec1f2",
        "author": "Mark",
        "comments": [],
        "content": "Hello everyone, I'm new here, could someone show me around?",
        "date": "2023-04-03 13:32:35",
        "title": "New post"
    },
    {
        "_id": "642ad2f62361f4eb2e2ec1d6",
        "author": "Marklemore",
        "comments": [],
        "content": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,\nmolestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum\nnumquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium\noptio, eaque rerum! Provident similique accusantium nemo autem. Veritatis\nobcaecati tenetur iure eius earum ut molestias architecto voluptate aliquam\nnihil, eveniet aliquid culpa officia aut! Impedit sit sunt quaerat, odit,\ntenetur error, harum nesciunt ipsum debitis quas aliquid.\n\nLorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,\nmolestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum\nnumquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium\noptio, eaque rerum! Provident similique accusantium nemo autem. Veritatis\nobcaecati tenetur iure eius earum ut molestias architecto voluptate aliquam\nnihil, eveniet aliquid culpa officia aut! Impedit sit sunt quaerat, odit,\ntenetur error, harum nesciunt ipsum debitis quas aliquid.",
        "date": "2023-04-03 13:21:58",
        "title": "What does this mean??"
    },
    {
        "_id": "642ad2e62361f4eb2e2ec1d3",
        "author": "Mark",
        "comments": [],
        "content": "Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime mollitia,\nmolestiae quas vel sint commodi repudiandae consequuntur voluptatum laborum\nnumquam blanditiis harum quisquam eius sed odit fugiat iusto fuga praesentium\noptio, eaque rerum! Provident similique accusantium nemo autem. Veritatis\nobcaecati tenetur iure eius earum ut molestias architecto voluptate aliquam\nnihil, eveniet aliquid culpa officia aut! Impedit sit sunt quaerat, odit,\ntenetur error, harum nesciunt ipsum debitis quas aliquid.",
        "date": "2023-04-03 13:21:42",
        "title": "Filler post"
    }
]);

