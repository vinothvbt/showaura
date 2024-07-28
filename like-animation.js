document.addEventListener('DOMContentLoaded', function () {
    const likeIcons = document.querySelectorAll('.like-icon');
    const commentIcons = document.querySelectorAll('.comment-icon');
    const shareIcons = document.querySelectorAll('.share-icon');

    likeIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Toggle the 'liked' class
            this.classList.toggle('liked');
        });
    });

    commentIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Handle comment button click
            alert('Comment functionality not implemented.');
        });
    });

    shareIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            // Handle share button click
            alert('Share functionality not implemented.');
        });
    });
});
