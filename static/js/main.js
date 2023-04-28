async function clearPosts() {
    if (!confirm('This will delete the entire posts table in the database permanently. \n\nPress "OK" to delete the table.')) {
        return;
    }
    const response = await fetch('/clear_posts', {
        method: 'POST'
    });

    if (response.ok) {
        fetchPosts(); // Reload the posts
    } else {
        alert('Error clearing posts');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // var elem = document.querySelector("#posts");
    // var msnry = new Masonry(elem, {
    //     // options
    //     itemSelector: ".post",
    //     columnWidth: ".post",
    //     percentPosition: true,
    //     gutter: parseInt(window.getComputedStyle(elem).getPropertyValue("gap")),
    // });
});

function initMasonry() {
    var elem = document.querySelector("#posts");
    var msnry = new Masonry(elem, {
        // options
        itemSelector: ".post",
        columnWidth: ".post",
        percentPosition: true,
        gutter: 16,
    });
}

// Register
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

// Login
async function loginUser() {
    const username = document.querySelector('#login-username').value;
    const password = document.querySelector('#login-password').value;

    const response = await fetch('/login', {
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

// Logout
async function logoutUser() {
    await fetch('/logout', { method: 'GET' });
    window.location.reload();
}

async function dropPosts() {
    db = db.getSiblingDB("posts_db");
    db.posts_tb.drop();
}

async function fetchPosts() {
    const response = await fetch('/posts');
    const data = await response.json();
    const postsElement = document.getElementById('posts');



    postsElement.innerHTML = `
    <div id="posts-footer">
        <p>You've reached the bottom!</p>
    </div> `;

    data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    getSessionInfo().then(session => {
        if (session.username) {
            console.log("im in >:)")
            postsElement.innerHTML = postsElement.innerHTML + `<div class="post" id="new-post">
            <form id="new-post-form">
                    <input type="text" id="new-title" name="title" placeholder="Title" required>
                        <br>
                    <textarea id="new-content" name="content" placeholder="Write something!" required></textarea>
                        <br>
                    <button class="frosted" type="submit"> 
                        <i class="fas fa-plus plus-icon"></i>
                    </button>
                </form>
            </div>`;

            const postForm = document.getElementById('new-post-form');
            postForm.addEventListener('submit', createPost);

            const logoutButton = document.getElementById('logout-button');
            logoutButton.classList.remove('hidden');
            logoutButton.addEventListener('click', (event) => {
                event.preventDefault();
                logoutUser();
            });
        } else {
            const loginButton = document.getElementById('login-button');
            loginButton.classList.remove('hidden');
        }

        data.posts.forEach(post => {
            getUserInfo(post.author).then(author => {
                const postElement = document.createElement('div');
                postElement.className = 'post frosted';
                postElement.innerHTML = `
                    <i class="fas fa-trash-alt trashcan-icon"></i>
                    <div class="main-post">
                        <p class="post-meta">By <a class="author-url" href='/u/${author.id}'>${author.username}</a> on ${post.date}</p>
                        <h2 class="post-title">${post.title}</h2>
                        <p class="post-content">${post.content}</p>
                    </div>
                    <i class="fas fa-comment-alt comments-icon"> ${post.comments.length}</i>
                    `;
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
        });
    });


    initMasonry();
}

async function fetchPost() {
    const response = await fetch('/posts/' + window.location.pathname.split('/')[2]);

    if (!response.ok) {
        // Handle the case when the post is not found
        if (response.status === 404) {
            alert('Post not found');
        } else {
            alert('Error viewing post... Returning to feed!');
            window.location.href = `/feed`;
        }
        return;
    }

    const post = await response.json();
    const postElement = document.getElementById('post');

    postElement.className = 'post';
    postElement.innerHTML = `

        <i class="fas fa-trash-alt trashcan-icon"></i>
        <div class="main-post frosted">
            <p class="post-meta">By ${post.author} on ${post.date}</p>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-content">${post.content}</p>
        </div>
        <div class="comments-section">
            <div class="comments">
                <ul>
                    ${post.comments.map(comment => `
                        <li>
                            <div class="comment">
                                <p class="comment-meta">By ${comment.author} on ${comment.date}</p>
                                <p>${comment.content}</p>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div>
                <form class="comment-form" id="comment-form-${post._id}">
                    <!--<input type="text" id="author-${post._id}" class="author-field" name="author" placeholder="Author" required>-->
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
        fetchPosts(); // Reload the posts
    } else if (response.status == 400) {
        alert('Your post contains profanity. Please remove it and try again.');
    } else {
        alert('Error creating post: ' + response.message);
    }
}

async function deletePost(event) {
    const postId = event.target.dataset.postId;
    const response = await fetch(`/posts/${postId}`, {
        method: 'DELETE'
    });

    if (response.ok) {
        fetchPosts(); // Reload the posts
    } else {
        alert('Error deleting post');
    }
}

async function createComment(event) {
    event.preventDefault();

    const form = event.target;
    const postId = form.dataset.postId;
    const content = form.querySelector(`#content-${postId}`).value;
    const author = form.querySelector(`#author-${postId}`).value;

    const response = await fetch(`/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, author })
    });

    if (response.ok) {
        form.reset();
        fetchPost(); // Reload the post
    } else {
        alert('Error creating comment');
    }
}

// Event listeners
document.querySelector('#register-form').addEventListener('submit', (event) => {
    event.preventDefault();
    registerUser();
});

document.querySelector('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    loginUser();
});

document.querySelector('#logout-button').addEventListener('click', (event) => {
    event.preventDefault();
    logoutUser();
});

async function getSessionInfo() {
    const response = await fetch('/session_info', {
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