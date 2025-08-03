const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + extension);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for profile pictures'));
        }
    }
});

// Get user profile
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.get(
        `SELECT id, username, email, aura_points, profile_image, bio, created_at
         FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Get user's posts
            db.all(
                `SELECT p.*, COUNT(l.id) as like_count
                 FROM posts p
                 LEFT JOIN likes l ON p.id = l.post_id
                 WHERE p.user_id = ?
                 GROUP BY p.id
                 ORDER BY p.created_at DESC`,
                [userId],
                (err, posts) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to fetch user posts' });
                    }
                    
                    res.json({ 
                        user: {
                            ...user,
                            postCount: posts.length,
                            totalLikes: posts.reduce((sum, post) => sum + post.like_count, 0)
                        },
                        posts 
                    });
                }
            );
        }
    );
});

// Update user profile
router.put('/update', authenticateToken, (req, res) => {
    const { bio, username } = req.body;
    const userId = req.user.userId;
    
    // Build update query dynamically
    let updateFields = [];
    let params = [];
    
    if (bio !== undefined) {
        updateFields.push('bio = ?');
        params.push(bio);
    }
    
    if (username) {
        // Check if username is already taken
        db.get(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userId],
            (err, existingUser) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                if (existingUser) {
                    return res.status(400).json({ error: 'Username already taken' });
                }
                
                updateFields.push('username = ?');
                params.push(username);
                
                if (updateFields.length === 0) {
                    return res.status(400).json({ error: 'No fields to update' });
                }
                
                params.push(userId);
                
                db.run(
                    `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    params,
                    (err) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({ error: 'Failed to update profile' });
                        }
                        
                        res.json({ message: 'Profile updated successfully' });
                    }
                );
            }
        );
    } else {
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        params.push(userId);
        
        db.run(
            `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            params,
            (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to update profile' });
                }
                
                res.json({ message: 'Profile updated successfully' });
            }
        );
    }
});

// Upload profile image
router.post('/upload-image', authenticateToken, profileUpload.single('profileImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        
        const imagePath = `/uploads/profiles/${req.file.filename}`;
        const userId = req.user.userId;
        
        // Get current profile image to delete it
        db.get('SELECT profile_image FROM users WHERE id = ?', [userId], (err, user) => {
            if (!err && user && user.profile_image) {
                const oldImagePath = path.join(__dirname, '..', user.profile_image);
                fs.unlink(oldImagePath, () => {}); // Delete old image, ignore errors
            }
            
            // Update user's profile image
            db.run(
                'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [imagePath, userId],
                (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        // Delete uploaded file if database update fails
                        fs.unlink(req.file.path, () => {});
                        return res.status(500).json({ error: 'Failed to update profile image' });
                    }
                    
                    res.json({ 
                        message: 'Profile image updated successfully',
                        profileImage: imagePath
                    });
                }
            );
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user account
router.delete('/delete', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    // Get user's profile image and posts to delete files
    db.get('SELECT profile_image FROM users WHERE id = ?', [userId], (err, user) => {
        if (!err && user && user.profile_image) {
            const imagePath = path.join(__dirname, '..', user.profile_image);
            fs.unlink(imagePath, () => {}); // Delete profile image
        }
    });
    
    // Get user's post media files to delete
    db.all('SELECT media_path FROM posts WHERE user_id = ?', [userId], (err, posts) => {
        if (!err && posts) {
            posts.forEach(post => {
                const mediaPath = path.join(__dirname, '..', post.media_path);
                fs.unlink(mediaPath, () => {}); // Delete media files
            });
        }
    });
    
    // Delete user (cascade will handle posts and likes)
    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to delete account' });
        }
        
        res.json({ message: 'Account deleted successfully' });
    });
});

module.exports = router;