document.addEventListener('DOMContentLoaded', function () {
    const likeButtons = document.querySelectorAll('.like-icon');
    const commentButtons = document.querySelectorAll('.comment-icon');
    const shareButtons = document.querySelectorAll('.share-icon');

    likeButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Toggle the 'liked' class
            this.classList.toggle('liked');
            
            // Find the heart icon and toggle its style
            const heartIcon = this.querySelector('i');
            if (this.classList.contains('liked')) {
                heartIcon.className = 'fas fa-heart'; // Filled heart
                heartIcon.style.color = '#ff3a17';
            } else {
                heartIcon.className = 'far fa-heart'; // Outline heart
                heartIcon.style.color = '';
            }
        });
    });

    commentButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Handle comment button click with modern UI feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
                alert('Comment functionality coming soon!');
            }, 150);
        });
    });

    shareButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Handle share button click with modern UI feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
                // Modern share functionality
                if (navigator.share) {
                    navigator.share({
                        title: 'Check out this talent on ShowAura!',
                        text: 'Amazing talent showcase',
                        url: window.location.href,
                    });
                } else {
                    // Fallback for browsers that don't support Web Share API
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                }
            }, 150);
        });
    });
});
