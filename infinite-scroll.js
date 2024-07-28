// infinite-scroll.js

document.addEventListener('DOMContentLoaded', function () {
    let loadingIndicator = document.getElementById('loading-indicator');
    let isLoading = false;

    function checkScrollPosition() {
        let scrollPosition = window.innerHeight + window.scrollY;
        let pageHeight = document.documentElement.scrollHeight;

        if (scrollPosition >= pageHeight - 100) {
            if (!isLoading) {
                isLoading = true;
                loadingIndicator.style.display = 'block';

                // Simulate loading more content
                setTimeout(() => {
                    loadingIndicator.style.display = 'none';
                    isLoading = false;

                    // Here you can add more items to the showcase
                    // Example: fetch new items from the server and append them to the showcase
                }, 2000); // Adjust the timeout duration as needed
            }
        }
    }

    window.addEventListener('scroll', checkScrollPosition);
});
