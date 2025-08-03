document.addEventListener('DOMContentLoaded', function () {
    const likeIcons = document.querySelectorAll('.like-icon');
    const commentIcons = document.querySelectorAll('.comment-icon');
    const shareIcons = document.querySelectorAll('.share-icon');

    likeIcons.forEach(icon => {
        icon.addEventListener('click', async function () {
            const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
            if (!postId) return;

            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login to like posts');
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(`/api/upload/like/${postId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    // Toggle the 'liked' class
                    this.classList.toggle('liked');
                    
                    // Update like count if element exists
                    const likeCountElement = this.closest('.post-meta')?.querySelector('.likes');
                    if (likeCountElement) {
                        const currentCount = parseInt(likeCountElement.textContent) || 0;
                        const newCount = data.liked ? currentCount + 1 : currentCount - 1;
                        likeCountElement.textContent = `${newCount} likes`;
                    }

                    // Add animation
                    this.style.transform = 'scale(1.2)';
                    setTimeout(() => {
                        this.style.transform = 'scale(1)';
                    }, 200);
                } else {
                    alert(data.error || 'Failed to like post');
                }
            } catch (error) {
                console.error('Error liking post:', error);
                alert('Network error. Please try again.');
            }
        });
    });

    commentIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
            
            // For now, show a simple prompt for comments
            // This could be expanded to show a comment modal or redirect to a detailed view
            const comment = prompt('Add a comment:');
            if (comment && comment.trim()) {
                // TODO: Implement comment API endpoint
                alert('Comment functionality will be available in the next update!');
            }
        });
    });

    shareIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const postId = this.closest('[data-post-id]')?.getAttribute('data-post-id');
            const postElement = this.closest('.showcase-item');
            const title = postElement?.querySelector('h3')?.textContent || 'Check out this talent on ShowAura!';
            
            // Use Web Share API if available, otherwise fallback to clipboard
            if (navigator.share) {
                navigator.share({
                    title: title,
                    url: `${window.location.origin}/post/${postId}`
                }).catch(err => console.log('Error sharing:', err));
            } else {
                // Fallback: copy to clipboard
                const shareUrl = `${window.location.origin}/post/${postId}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Share link copied to clipboard!');
                }).catch(() => {
                    // Final fallback
                    prompt('Copy this link to share:', shareUrl);
                });
            }
        });
    });
});
