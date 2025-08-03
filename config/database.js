const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'showaura.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeTables();
    }
});

// Initialize database tables
function initializeTables() {
    // Users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            aura_points INTEGER DEFAULT 0,
            profile_image TEXT DEFAULT NULL,
            bio TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err.message);
        else console.log('Users table ready');
    });

    // Posts table for user uploads
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            media_type TEXT NOT NULL,
            media_path TEXT NOT NULL,
            skill_category TEXT,
            likes INTEGER DEFAULT 0,
            aura_earned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating posts table:', err.message);
        else console.log('Posts table ready');
    });

    // Likes table to track user likes
    db.run(`
        CREATE TABLE IF NOT EXISTS likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error('Error creating likes table:', err.message);
        else console.log('Likes table ready');
    });

    // Insert sample data if tables are empty
    insertSampleData();
}

// Insert sample data for development
function insertSampleData() {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (!err && row.count === 0) {
            // Need to require bcrypt here since it's not available at module level
            const bcrypt = require('bcryptjs');
            
            // Sample users
            const sampleUsers = [
                {
                    username: 'monk@alive',
                    email: 'monk@example.com',
                    password: bcrypt.hashSync('password123', 10),
                    aura_points: 1000,
                    bio: 'Kungfu master sharing ancient techniques'
                },
                {
                    username: '~Himawari006',
                    email: 'himawari@example.com', 
                    password: bcrypt.hashSync('password123', 10),
                    aura_points: 900,
                    bio: 'Artist expressing creativity through drawings'
                },
                {
                    username: 'binotsuke1407',
                    email: 'bino@example.com',
                    password: bcrypt.hashSync('password123', 10),
                    aura_points: 800,
                    bio: 'Painter bringing colors to life'
                },
                {
                    username: 'Daylight@24',
                    email: 'daylight@example.com',
                    password: bcrypt.hashSync('password123', 10),
                    aura_points: 700,
                    bio: 'Drawing enthusiast sharing daily art'
                }
            ];

            let insertedCount = 0;
            sampleUsers.forEach(user => {
                db.run(`
                    INSERT INTO users (username, email, password, aura_points, bio)
                    VALUES (?, ?, ?, ?, ?)
                `, [user.username, user.email, user.password, user.aura_points, user.bio], function(err) {
                    if (err) {
                        console.error('Error inserting sample user:', err.message);
                    } else {
                        insertedCount++;
                        if (insertedCount === sampleUsers.length) {
                            console.log('Sample users inserted successfully');
                        }
                    }
                });
            });
        }
    });
}

module.exports = db;