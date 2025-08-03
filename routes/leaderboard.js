const express = require('express');
const db = require('../config/database');

const router = express.Router();

// Get leaderboard data
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const skillCategory = req.query.skill;
    
    let query = `
        SELECT u.id, u.username, u.aura_points, u.profile_image, u.bio,
               COUNT(p.id) as post_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.user_id
    `;
    
    let params = [];
    
    if (skillCategory && skillCategory !== 'all') {
        query += ` WHERE p.skill_category = ?`;
        params.push(skillCategory);
    }
    
    query += `
        GROUP BY u.id
        ORDER BY u.aura_points DESC
        LIMIT ?
    `;
    params.push(limit);
    
    db.all(query, params, (err, users) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
        
        res.json({ leaderboard: users });
    });
});

// Get skill categories
router.get('/categories', (req, res) => {
    db.all(
        'SELECT DISTINCT skill_category FROM posts WHERE skill_category IS NOT NULL ORDER BY skill_category',
        [],
        (err, categories) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch categories' });
            }
            
            const categoryList = categories.map(cat => cat.skill_category);
            res.json({ categories: categoryList });
        }
    );
});

// Get top performers for today
router.get('/daily', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    
    db.all(
        `SELECT u.id, u.username, u.aura_points, u.profile_image,
                COUNT(p.id) as posts_today,
                SUM(p.likes) as likes_today
         FROM users u
         LEFT JOIN posts p ON u.id = p.user_id AND DATE(p.created_at) = ?
         GROUP BY u.id
         HAVING posts_today > 0
         ORDER BY likes_today DESC, posts_today DESC
         LIMIT 5`,
        [today],
        (err, dailyTop) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch daily top performers' });
            }
            
            res.json({ dailyTop });
        }
    );
});

// Get user rank
router.get('/rank/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Get user's rank based on aura points
    db.get(
        `SELECT COUNT(*) + 1 as rank
         FROM users 
         WHERE aura_points > (SELECT aura_points FROM users WHERE id = ?)`,
        [userId],
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to fetch user rank' });
            }
            
            // Get total number of users
            db.get('SELECT COUNT(*) as total FROM users', [], (err, total) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to fetch total users' });
                }
                
                res.json({ 
                    rank: result.rank,
                    totalUsers: total.total 
                });
            });
        }
    );
});

module.exports = router;