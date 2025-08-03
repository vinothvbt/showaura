document.addEventListener('DOMContentLoaded', function() {
    const editButton = document.querySelector('.edit-button');
    const editForm = document.querySelector('.edit-form');
    const cancelButton = document.querySelector('.cancel-button');
    const saveForm = document.querySelector('.edit-form form');

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        alert('Please login to view your profile');
        window.location.href = 'login.html';
        return;
    }

    // Load user profile data
    loadUserProfile(user.id);

    editButton.addEventListener('click', function() {
        editForm.classList.toggle('hidden');
    });

    cancelButton.addEventListener('click', function() {
        editForm.classList.add('hidden');
    });

    // Handle profile update
    saveForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const bio = document.getElementById('bio').value;
        
        try {
            const response = await fetch('/api/profile/update', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    bio: bio
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Profile updated successfully!');
                editForm.classList.add('hidden');
                
                // Update local storage and reload profile
                if (username !== user.username) {
                    user.username = username;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                
                loadUserProfile(user.id);
            } else {
                alert(data.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Network error. Please try again.');
        }
    });

    async function loadUserProfile(userId) {
        try {
            const response = await fetch(`/api/profile/${userId}`);
            const data = await response.json();

            if (response.ok) {
                updateProfileDisplay(data.user, data.posts);
            } else {
                console.error('Error loading profile:', data.error);
                document.querySelector('.profile').innerHTML = '<p style="color: #fff; text-align: center;">Error loading profile</p>';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            document.querySelector('.profile').innerHTML = '<p style="color: #fff; text-align: center;">Error loading profile</p>';
        }
    }

    function updateProfileDisplay(user, posts) {
        // Update profile header
        const profilePic = document.querySelector('.profile-pic img');
        const username = document.querySelector('.profile-info h1');
        const bio = document.querySelector('.profile-info .bio');
        
        profilePic.src = user.profile_image || 'purpleshowaura.png';
        profilePic.alt = `${user.username}'s profile picture`;
        username.textContent = user.username;
        bio.textContent = user.bio || 'No bio yet...';

        // Update form fields
        document.getElementById('username').value = user.username;
        document.getElementById('bio').value = user.bio || '';

        // Update posts grid
        const postsGrid = document.querySelector('.posts-grid');
        postsGrid.innerHTML = '';

        if (posts && posts.length > 0) {
            posts.forEach(post => {
                const postItem = document.createElement('div');
                postItem.className = 'post-item';
                postItem.setAttribute('data-post-id', post.id);
                
                let mediaElement = '';
                if (post.media_type === 'image') {
                    mediaElement = `<img src="${post.media_path}" alt="${post.title}">`;
                } else if (post.media_type === 'video') {
                    mediaElement = `<video src="${post.media_path}" muted><source src="${post.media_path}" type="video/mp4"></video>`;
                } else {
                    mediaElement = `<div class="audio-post"><i class="fas fa-music"></i><p>${post.title}</p></div>`;
                }
                
                postItem.innerHTML = `
                    ${mediaElement}
                    <div class="post-overlay">
                        <span class="likes">${post.like_count || 0} ❤️</span>
                        <span class="views">👁️</span>
                    </div>
                `;
                
                postsGrid.appendChild(postItem);
            });
        } else {
            postsGrid.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #fff; padding: 20px;"><p>No posts yet!</p><a href="upload.html" style="color: rgb(157,0,255);">Upload your first talent</a></div>';
        }

        // Update stats
        const statsContainer = document.querySelector('.stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat">
                    <span class="stat-number">${posts ? posts.length : 0}</span>
                    <span class="stat-label">Posts</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${user.aura_points || 0}</span>
                    <span class="stat-label">Aura</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${user.totalLikes || 0}</span>
                    <span class="stat-label">Likes</span>
                </div>
            `;
        }
    }
});
