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


async function dropPosts() {
    db = db.getSiblingDB("posts_db");
    db.posts_tb.drop();
}

function toggleComments(event) {
    const postId = event.target.dataset.postId;
    const commentsElement = document.querySelector(`#comments-${postId}`);
    commentsElement.classList.toggle('hidden');
}

function toggleNestedComments(event) {
    const commentId = event.target.dataset.commentId;
    const nestedCommentsElement = document.querySelector(`#nested-comments-${commentId}`);
    nestedCommentsElement.classList.toggle('hidden');
}

async function fetchPosts() {
    document.getElementById('clear-posts-btn').addEventListener('click', clearPosts);
    const response = await fetch('/posts');
    const data = await response.json();
    const postsElement = document.getElementById('posts');
    postsElement.innerHTML = "";

    data.posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    data.posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post frosted';
        postElement.innerHTML = `
        <div class="main-post">
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
}

async function createPost(event) {
    event.preventDefault();

    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const author = document.getElementById('author').value;

    const response = await fetch('/create_post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content, author })
    });

    if (response.ok) {
        document.getElementById('new-post-form').reset();
        window.location.href = '/feed';
    } else {
        alert('Error creating post');
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
