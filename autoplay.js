document.addEventListener('DOMContentLoaded', () => {
    const showcaseItems = document.querySelectorAll('.showcase-item video');

    const handleScroll = () => {
        const windowHeight = window.innerHeight;
        showcaseItems.forEach(video => {
            const videoRect = video.getBoundingClientRect();
            if (videoRect.top < windowHeight && videoRect.bottom >= 0) {
                if (video.paused) {
                    video.play();
                }
            } else {
                if (!video.paused) {
                    video.pause();
                }
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
});
