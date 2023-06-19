const blocked_title = "[blocked]"
const blocked_content = "Please contact an admin if you believe this post was blocked in error."

// Register user
async function registerUser() {
    const username = document.querySelector('#register-username').value;
    const password = document.querySelector('#register-password').value;
    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
    });

    if (response.ok) {
        window.location.reload();
    } else {
        const error = await response.json();
        console.error(error);
    }
}

// Login user
async function loginUser() {
    const username = document.querySelector('#login-username').value;
    const password = document.querySelector('#login-password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, password }),
    });

    if (response.ok) {
        getSessionInfo((session) => {
            if (session.username) {
                window.location.href = '/feed'; // Redirect the user to the desired page
            } else {
                console.error("Failed to log in");
            }
        });
    } else {
        const error = await response.json();
        console.error(error);
    }
}

// Logout user
async function logoutUser() {
    await fetch('/logout', { method: 'GET' });
    window.location.reload();
}

// Get user info
async function getUserInfo(user_id) {
    const response = await fetch(`/user_info/${user_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },

    });

    if (response.ok) {
        const userInfo = await response.json();
        return userInfo;
    } else {
        const error = await response.json();
        throw new Error(error.error);
    }
}

// Get session info
async function getSessionInfo(callback) {
    const response = await fetch('/session_info', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
        const userInfo = await response.json();
        if (callback) {
            callback(userInfo); // Call the callback function here
        } else {
            return userInfo;
        }
    } else {
        const error = await response.json();
        console.log(error)
        return error;
    }
}

// Delete all posts
async function clearPosts() {
    if (!confirm('This will delete the entire posts table in the database permanently. \n\nPress "OK" to delete the table.')) {
        return;
    }
    const response = await fetch('/clear_posts', {
        method: 'POST'
    });

    if (response.ok) {
        loadFeed(); // Reload the posts
    } else {
        alert('Error clearing posts');
    }
}

async function dropPosts() {
    db = db.getSiblingDB("posts_db");
    db.posts_tb.drop();
}

// Create a new post
async function createPost(event) {
    event.preventDefault();

    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;

    const response = await fetch('/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
    });

    if (response.ok) {
        loadFeed(); // Reload the posts
    } else if (response.status == 400) {
        alert('Your post contains profanity. Please remove it and try again.');
    } else {
        alert('Error creating post: ' + response.status);
    }
}

async function loadFeed() {
    await fetchPosts();
    console.log("Loaded posts");
}

// Fetch and display all posts and post content
async function fetchPosts() {
    const response = await fetch('/posts');
    const data = await response.json();
    const postsElement = document.getElementById('posts');
    const headerElement = document.getElementById('header');

    postsElement.innerHTML = `
    <div id="posts-footer">
        <p>You've reached the bottom!</p>
    </div> `;

    data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log(data.posts);

    getSessionInfo().then(session => {

        t = setTimeout(initMasonry, 1000);
        data.posts.forEach(post => {
            getUserInfo(post.author).then(author => {
                const postElement = document.createElement('div');
                postElement.className = 'post frosted' + (post.blocked  == "True" ? ' blocked' : '')  + (post.misinformation  == "True" ? ' misinfo' : '');
                if (post.blocked == "False" || post.title != '') {
                    postElement.innerHTML = `
                    <i class="fas fa-trash-alt trashcan-icon"></i>
                    <div class="main-post">
                        <p class="post-meta"><span class='post-author'>${author.username}</span> on ${post.date}</p>
                        <h2 class="post-title">${post.title}</h2>
                        <p class="post-content">${post.content}</p>
                    </div>
                    <i class="fas fa-comment-alt comments-icon"> ${(post.comments && post.comments.length) || 0}</i>
                    `;
                } else {
                    postElement.innerHTML = `
                    <i class="fas fa-trash-alt trashcan-icon"></i>
                    <div class="main-post">
                        <p class="post-meta"><span class="post-author">${author.username}</span> on ${post.date}</p>
                        <h2 class="post-title">${blocked_title}</h2>
                        <p class="post-content">${blocked_content}}</p>
                    </div>
                    <i class="fas fa-comment-alt comments-icon"> ${(post.comments && post.comments.length) || 0}</i>
                    `; 
                }
                postsElement.appendChild(postElement);

                postElement.addEventListener('click', (event) => {
                    // Check if the event target is not a trashcan icon or any form element
                    if (
                        !event.target.matches('.trashcan-icon, form, form *') &&
                        !event.target.closest('.comments-section')
                    ) {
                        window.location.href = `/p/${post._id}`;
                    }
                });


                const trashcanIcon = postElement.querySelector('.trashcan-icon');
                trashcanIcon.dataset.postId = post._id;
                trashcanIcon.addEventListener('click', deletePost);
            });

            // TODO - Garbage solution to masonry not working on load
            clearTimeout(t);
            t = setTimeout(initMasonry, 400);

            console.log("Instantiated post: " + post.title);
        });

        
        if (session.username) {
            console.log("Logged in as user: " + session.username)

            headerElement.innerHTML = `<div class="post" id="new-post">
            <form id="new-post-form">
                    <input type="text" id="new-title" name="title" placeholder="Say something interesting" required>
                        <br>
                    <div class="content-submit">
                    <textarea type="text" id="new-content" name="content" placeholder="... and write about it!" required></textarea>
                    <button class="frosted" type="submit" id="newform-submit"> 
                        <i class="fas fa-plus plus-icon"></i>
                    </button>
                    </div>
                </form>
            </div>`;

            const postForm = document.getElementById('new-post-form');
            postForm.addEventListener('submit', createPost);

            // Here is the new code to handle the Enter key press in the textarea
            const newContent = document.getElementById('new-content');
            newContent.addEventListener('keydown', function(e) {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    document.querySelector('#newform-submit').click();
                }
            });

            const logoutButton = document.getElementById('logout-button');
            logoutButton.classList.remove('hidden');
            logoutButton.addEventListener('click', (event) => {
                event.preventDefault();
                logoutUser();
            });

            // initMasonry();
        } else {
            const loginButton = document.getElementById('login-button');
            loginButton.classList.remove('hidden');
        }

        //  TODO - FIX GARBAGE CODE
        // setTimeout(() => {
        //     initMasonry();
        // }, 500);
    });
}

// Fetch and display a single post and its content
// Fetch and display a single post and its content
async function fetchPost() {
    const response = await fetch('/posts/' + window.location.pathname.split('/')[2]);

    if (!response.ok) {
        // Handle the case when the post is not found
        if (response.status === 404) {
            alert('Post not found');
        } else {
            alert('Error viewing post:' + response.status);
            window.location.href = `/feed`;
        }
        return;
    }

    const data = await response.json();
    const post = data.post;
    const postElement = document.getElementById('post');
    let postContent = post.content;
    let postTitle = post.title;
    
    // Fetch the author information
    const author = await getUserInfo(post.author);

    if (post.blocked == "True" || post.title == '') {
        postContent = `${blocked_content}`;
        postTitle = `${blocked_title}`;
    }
    postElement.className = postElement.className + (post.blocked  == "True" ? ' blocked' : '');
    postElement.className = postElement.className + (post.misinformation  == "True" ? ' misinformation' : '');
    

    const commentsHTML = await Promise.all(post.comments.map(async comment => {
        let commentContent = comment.content;
        // Fetch the comment author information
        const commentAuthor = await getUserInfo(comment.author);

        if (comment.blocked == 'True' || comment.content == '') {
            commentContent = `${blocked_title}`;
        }
        return `
        <li>
            <div class="comment${(post.blocked  == "True" ? ' blocked' : '')}">
                <p class="comment-meta"><span class="post-author">${commentAuthor.username}</span> on ${comment.date}</p>
                <p>${commentContent}</p>
            </div>
        </li>`;
    }));

    postElement.innerHTML = `
        <i class="fas fa-trash-alt trashcan-icon"></i>
        <div class="main-post">
            <p class="post-meta"><span class="post-author">${author.username}</span> on ${post.date}</p>
            <h2 class="post-title">${postTitle}</h2>
            <p class="post-content">${postContent}</p>
        </div>
        <div class="comments-section">
            <div class="comments">
                <ul>
                    ${commentsHTML.join('')}
                </ul>
            </div>
            <div>
                <form class="comment-form" id="comment-form-${post._id}">
                    <textarea rows="2" id="content-${post._id}" class="comment-field" name="content" placeholder="Leave a comment" required></textarea>
                    <br>
                    <div class="submission">
                        <button type="submit">
                        <i class="fas fa-comment-alt comments-icon"></i>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const commentForm = postElement.querySelector(`#comment-form-${post._id}`);
    commentForm.dataset.postId = post._id;
    commentForm.addEventListener('submit', createComment);
}




// Create a new comment
async function createComment(event) {
    event.preventDefault();

    const form = event.target;
    const postId = form.dataset.postId;
    const content = form.querySelector(`#content-${postId}`).value;

    const response = await fetch(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
    });

    if (response.ok) {
        form.reset();
        fetchPost(); // Reload the post
    } else {
        alert('Error creating comment: ' + response.status);
    }
}


// Delete a post
async function deletePost(event) {
    const postId = event.target.dataset.postId;
    const response = await fetch(`/posts/${postId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        loadFeed(); // Reload the posts
    } else {
        alert('Error deleting post: ' + response.status);
    }
}

// Initialize Masonry layout
function initMasonry() {
    var elem = document.querySelector("#posts");
    var msnry = new Masonry(elem, {
        // options
        itemSelector: ".post",
        columnWidth: ".post",
        percentPosition: true,
        gutter: 16,
    });
    console.log("Initialized Masonry layout")
    return msnry; // return the Masonry instance
}

// Initialize the page and fetch session info
async function initPage() {
    try {
        const session = await getSessionInfo();
        if (session.username) {
            const welcomeMessage = document.getElementById("local-profile-info");
            welcomeMessage.innerHTML = `<h3>Welcome ${session.username},</h3>`;
        }
    } catch (error) {
        console.error("Error getting session info:", error);
    }
    loadFeed();
}

// Event listeners
const registerForm = document.querySelector('#register-form');
if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        registerUser();
    });
}

const loginForm = document.querySelector('#login-form');
if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loginUser();
    });
}

const logoutButton = document.querySelector('#logout-button');
if (logoutButton) {
    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        logoutUser();
    });
}

async function logoutUser() {
    const response = await fetch('/logout', {
        method: 'GET',
    });

    if (response.ok) {
        window.location.reload(); // Reload the page or redirect to a different page if needed
    } else {
        console.error("Failed to log out");
    }
}


// document.addEventListener("DOMContentLoaded", function () {
    
// });