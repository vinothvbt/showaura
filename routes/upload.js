const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// File filter to allow only images, videos, and audio
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|webm|mp3|wav|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image, video, and audio files are allowed'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: fileFilter
});

// Upload media endpoint
router.post('/media', authenticateToken, upload.single('media'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { description, skillCategory } = req.body;
        const mediaPath = `/uploads/${req.file.filename}`;
        const mediaType = req.file.mimetype.split('/')[0]; // 'image', 'video', or 'audio'

        // Save post to database
        db.run(
            `INSERT INTO posts (user_id, title, description, media_type, media_path, skill_category)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.userId,
                req.file.originalname,
                description || '',
                mediaType,
                mediaPath,
                skillCategory || 'General'
            ],
            function(err) {
                if (err) {
                    console.error('Database error:', err);
                    // Delete uploaded file if database save fails
                    fs.unlink(req.file.path, () => {});
                    return res.status(500).json({ error: 'Failed to save post' });
                }

                // Award aura points for posting (10 points)
                db.run(
                    'UPDATE users SET aura_points = aura_points + 10 WHERE id = ?',
                    [req.user.userId],
                    (err) => {
                        if (err) console.error('Error updating aura points:', err);
                    }
                );

                res.status(201).json({
                    message: 'Upload successful',
                    post: {
                        id: this.lastID,
                        mediaPath,
                        mediaType,
                        description,
                        skillCategory,
                        auraEarned: 10
                    }
                });
            }
        );
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's posts
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.all(
        `SELECT p.*, u.username 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC`,
        [userId],
        (err, posts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            
            res.json({ posts });
        }
    );
});

// Get all posts (for talent show page)
router.get('/all', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    db.all(
        `SELECT p.*, u.username, u.profile_image
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         ORDER BY p.created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, posts) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch posts' });
            }
            
            res.json({ posts, page, limit });
        }
    );
});

// Like/unlike a post
router.post('/like/:postId', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const userId = req.user.userId;
    
    // Check if user already liked this post
    db.get(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId],
        (err, like) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (like) {
                // Unlike the post
                db.run('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to unlike post' });
                    }
                    
                    // Decrease likes count
                    db.run('UPDATE posts SET likes = likes - 1 WHERE id = ?', [postId], (err) => {
                        if (err) console.error('Error updating likes count:', err);
                    });
                    
                    res.json({ message: 'Post unliked', liked: false });
                });
            } else {
                // Like the post
                db.run('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to like post' });
                    }
                    
                    // Increase likes count and award aura to post owner
                    db.run('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId], (err) => {
                        if (err) console.error('Error updating likes count:', err);
                    });
                    
                    // Award 5 aura points to the post owner
                    db.get('SELECT user_id FROM posts WHERE id = ?', [postId], (err, post) => {
                        if (!err && post) {
                            db.run('UPDATE users SET aura_points = aura_points + 5 WHERE id = ?', [post.user_id]);
                        }
                    });
                    
                    res.json({ message: 'Post liked', liked: true });
                });
            }
        }
    );
});

module.exports = router;