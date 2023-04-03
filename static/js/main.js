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

    // TODO: Check if user is logged in
    if (true) {
        postsElement.innerHTML = postsElement.innerHTML + `<div class="post frosted">
        <form id="new-post-form">
                <input type="text" id="new-author" name="author" placeholder="Author" required>
                    <br>
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
    }



    data.posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post frosted';
        postElement.innerHTML = `
        <div class="main-post">
            <p class="post-meta">By ${post.author} on ${post.date}</p>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-content">${post.content}</p>
            <i class="fas fa-trash-alt trashcan-icon"></i>
        </div>
        <div class="comments-section hidden">
            <div class="comments">
                <ul>
                    ${post.comments.map(comment => `
                        <li>
                            <div class="comment">
                                <!--<p class="comment-meta">By ${comment.author} on ${comment.date}</p>-->
                                <p>${comment.content}</p>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div>
                <form class="comment-form" id="comment-form-${post._id}">
                    <textarea rows="1" id="content-${post._id}" class="comment-field" name="content" placeholder="Leave a comment" required></textarea>
                    <br>
                    <div class="submission">
                        <input type="text" id="author-${post._id}" class="author-field" name="author" placeholder="Author" required>
                        <button type="submit">Add Comment</button>
                    </div>
                </form>
            </div>
        </div>
        `;
        postsElement.appendChild(postElement);

        const commentForm = postElement.querySelector(`#comment-form-${post._id}`);
        commentForm.dataset.postId = post._id;
        commentForm.addEventListener('submit', createComment);

        const trashcanIcon = postElement.querySelector('.trashcan-icon');
        trashcanIcon.dataset.postId = post._id;
        trashcanIcon.addEventListener('click', deletePost);

        // Get all textarea elements with class 'comment-field'
        const commentFields = document.querySelectorAll('.comment-field');

        // Iterate over each textarea and add event listeners
        commentFields.forEach((field) => {
            // Show the submission div when the textarea is focused
            field.addEventListener('focus', (event) => {
                const submissionDiv = event.target.parentElement.querySelector('.submission');
                submissionDiv.style.display = 'block';
                
            });

            // Hide the submission div when the textarea loses focus and is empty
            // TODO: Doesn't work when switching to author field
            field.addEventListener('blur', (event) => {
                const submissionDiv = event.target.parentElement.querySelector('.submission');
                if (event.target.value.trim() === '') {
                    submissionDiv.style.display = 'none';
                }
            });
        });
    });

    initMasonry();
}

async function createPost(event) {
    event.preventDefault();

    const title = document.getElementById('new-title').value;
    const content = document.getElementById('new-content').value;
    const author = document.getElementById('new-author').value;

    const response = await fetch('/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content, author })
    });

    if (response.ok) {
        fetchPosts(); // Reload the posts
    } else {
        alert('Error creating post');
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
        fetchPosts(); // Reload the posts
    } else {
        alert('Error creating comment');
    }
}
