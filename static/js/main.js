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
    if (confirm('This will delete the entire posts table in the database permanently. \n\nPress "OK" to delete the table.')) {
        const response = await fetch('/clear_posts', {
            method: 'POST'
        });

        if (response.ok) {
            loadFeed(); // Reload the posts
            console("posts cleared")
        } else {
            alert('Error clearing posts');
        }
    }
    return false;
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

async function fetchPosts() {
    const response = await fetch('/posts');
    const data = await response.json();

    const postsElement = document.getElementById('posts');
    const headerElement = document.getElementById('header');

    clearElement(postsElement);
    postsElement.append(createPostFooter());

    data.posts.sort((a, b) => new Date(b.rawdate) - new Date(a.rawdate));

    const session = await getSessionInfo();

    for (let post of data.posts) {
        const author = await getUserInfo(post.author);
        const postElement = createPostElement(post, author);
        postsElement.append(postElement);
    }

    displayHeaderContent(session, headerElement);

    // initMasonry() is called after all posts are fetched and added to the page
    initMasonry();
}



function clearElement(element) {
    element.innerHTML = '';
}

function createPostFooter() {
    const footer = document.createElement('div');
    footer.id = "posts-footer";
    footer.innerHTML = `<p>You've reached the bottom!</p>`;
    return footer;
}

function createPostElement(post, author) {
    const postElement = document.createElement('div');
    postElement.className = 'post frosted' + (post.blocked === "True" ? ' blocked' : '') + (post.misinformation === "True" ? ' misinfo' : '');
    postElement.innerHTML = generatePostHTML(post, author);
    postElement.addEventListener('click', (event) => redirectOnClick(event, post));
    const trashcanIcon = postElement.querySelector('.trashcan-icon');
    trashcanIcon.dataset.postId = post._id;
    trashcanIcon.addEventListener('click', deletePost);
    return postElement;
}

function generatePostHTML(post, author) {
    if (post.title == '') {
        post.title = blocked_title
        post.content = blocked_content
    }

    let postHTML = '';
    postHTML = getPostHTML(post, author);
    return postHTML;
}

function getPostHTML(post, author) {
    return `
        <i class="fas fa-trash-alt trashcan-icon"></i>
        <div class="main-post">
            <p class="post-meta"><span class='post-author'>${author.username}</span> ${post.date}</p>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-content">${post.content}</p>
        </div>
        <i class="fas fa-comment-alt comments-icon"> ${(post.comments && post.comments.length) || 0}</i>
        `;
}

function redirectOnClick(event, post) {
    if (!event.target.matches('.trashcan-icon, form, form *') && !event.target.closest('.comments-section')) {
        window.location.href = `/p/${post._id}`;
    }
}

function displayHeaderContent(session, headerElement) {
    if (session.username) {
        headerElement.innerHTML = generatePostFormHTML();
        document.getElementById('new-post-form').addEventListener('submit', createPost);
        document.getElementById('new-content').addEventListener('keydown', handleTextareaEnterKey);
        document.getElementById('logout-button').classList.remove('hidden');
        document.getElementById('logout-button').addEventListener('click', logoutUser);
    } else {
        document.getElementById('login-button').classList.remove('hidden');
    }
}

function generatePostFormHTML() {
    return `<div class="post" id="new-post">
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
}

function handleTextareaEnterKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        document.querySelector('#newform-submit').click();
    }
}

// Fetch and display a single post and its content
async function fetchPost() {
    // Get the post ID from the URL
    const postId = window.location.pathname.split('/')[2];
    
    // Fetch the post data
    const response = await fetch('/posts/' + postId);

    // Check if the response is OK, if not, handle the error
    if (!response.ok) {
        handleResponseError(response);
        return;
    }

    const data = await response.json();
    const post = data.post;

    // Get the main post element
    const postElement = document.getElementById('post');

    // Fetch the author information
    const author = await getUserInfo(post.author);

    // Update the post element class names based on the post status
    updatePostClassNames(post, postElement);

    // Append the post content and comments section to the post element
    postElement.innerHTML = '';
    postElement.append(createPostContent(post, author));
    postElement.append(await createCommentsSection(post));
}

// Handles the case when the fetch response is not OK
function handleResponseError(response) {
    // If the response status is 404, notify the user that the post was not found
    if (response.status === 404) {
        alert('Post not found');
    } 
    // If the response status is something else, notify the user of the error and redirect to the feed page
    else {
        alert('Error viewing post:' + response.status);
        window.location.href = `/feed`;
    }
}

// Update the class name of the post element based on the post status
function updatePostClassNames(post, postElement) {
    // If the post is blocked, add the 'blocked' class
    if (post.blocked === "True") postElement.classList.add('blocked');

    // If the post is misinformation, add the 'misinformation' class
    if (post.misinformation === "True") postElement.classList.add('misinformation');
}

// Create the post content HTML (for the /p/:id route)
function createPostContent(post, author) {
    // If the post has no title, set the content and title to the blocked content and title
    if (post.title === '') {
        post.content = `${blocked_content}`;
        post.title = `${blocked_title}`;
    }

    // Create a new div element and set its inner HTML to the post content HTML
    const postContentElement = document.createElement('div');
    postContentElement.innerHTML = getPostHTML(post, author);

    return postContentElement;
}

// Create the comments section HTML
async function createCommentsSection(post) {
    // Fetch the comments HTML
    const commentsHTML = await getCommentsHTML(post);

    // Create a new div element for the comments section
    const commentsSection = document.createElement('div');
    commentsSection.className = "comments-section";

    // Set the inner HTML of the comments section to the comments HTML and the comment form HTML
    commentsSection.innerHTML = `
        <div class="comments">
            <ul>
                ${commentsHTML.join('')}
            </ul>
        </div>
        ${generateCommentFormHTML(post)}
    `;

    // Add an event listener to the comment form submit event
    commentsSection.querySelector(`#comment-form-${post._id}`).addEventListener('submit', createComment);

    return commentsSection;
}

// Fetch the comments HTML
async function getCommentsHTML(post) {
    // Map each comment to its HTML
    return await Promise.all(post.comments.map(async comment => {
        // Fetch the comment author information
        const commentAuthor = await getUserInfo(comment.author);

        // Set the default comment content
        let commentContent = comment.content;

        // If the comment is blocked or has no content, set the content to the blocked title
        if (comment.content === '') {
            commentContent = `${blocked_title}`;
        }

        // Return the comment HTML
        return `
        <li>
            <div class="comment${(post.blocked === "True" ? ' blocked' : '')}">
                <p class="comment-meta"><span class="post-author">${commentAuthor.username}</span> ${comment.date}</p>
                <p>${commentContent}</p>
            </div>
        </li>`;
    }));
}

// Generate the comment form HTML
function generateCommentFormHTML(post) {
    return `
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
    `;
}

// Create a new comment
async function createComment(event) {
    event.preventDefault();

    const form = event.target;
    const postId = form.id.replace("comment-form-", "");
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