// infinite-scroll.js

document.addEventListener('DOMContentLoaded', function () {
    let loadingIndicator = document.getElementById('loading-indicator');
    let isLoading = false;
    let currentPage = 1;
    const postsPerPage = 10;

    function checkScrollPosition() {
        let scrollPosition = window.innerHeight + window.scrollY;
        let pageHeight = document.documentElement.scrollHeight;

        if (scrollPosition >= pageHeight - 100) {
            if (!isLoading) {
                loadMorePosts();
            }
        }
    }

    async function loadMorePosts() {
        isLoading = true;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        try {
            currentPage++;
            const response = await fetch(`/api/upload/all?page=${currentPage}&limit=${postsPerPage}`);
            const data = await response.json();

            if (response.ok && data.posts && data.posts.length > 0) {
                // Add new posts to the showcase
                appendPostsToShowcase(data.posts);
            } else {
                // No more posts to load
                if (loadingIndicator) {
                    loadingIndicator.innerHTML = '<p>No more content to load</p>';
                }
            }
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            isLoading = false;
            if (loadingIndicator) {
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                }, 1000);
            }
        }
    }

    function appendPostsToShowcase(posts) {
        const postsContainer = document.getElementById('posts-container');
        if (!postsContainer) return;

        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    function createPostElement(post) {
        const postDiv = document.createElement('div');
        postDiv.className = 'showcase-item';
        postDiv.setAttribute('data-post-id', post.id);

        let mediaElement = '';
        if (post.media_type === 'image') {
            mediaElement = `<img src="${post.media_path}" alt="${post.title}" loading="lazy">`;
        } else if (post.media_type === 'video') {
            mediaElement = `<video src="${post.media_path}" controls></video>`;
        } else if (post.media_type === 'audio') {
            mediaElement = `<audio src="${post.media_path}" controls></audio>`;
        }

        postDiv.innerHTML = `
            ${mediaElement}
            <div class="user-info">
                <span class="username">@${post.username}</span>
                <p class="caption">${post.description || ''}</p>
            </div>
            <div class="action-buttons">
                <div class="like-icon">
                    <i class="far fa-heart"></i>
                </div>
                <div class="comment-icon">
                    <i class="far fa-comment"></i>
                </div>
                <div class="share-icon">
                    <i class="fas fa-share"></i>
                </div>
            </div>
            <div class="post-meta" style="display: none;">
                <span class="likes">${post.likes || 0}</span>
            </div>
        `;

        return postDiv;
    }

    window.addEventListener('scroll', checkScrollPosition);
});
