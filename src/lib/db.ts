import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Create data directory if it doesn't exist
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const DB_PATH = path.join(DATA_DIR, 'cohort_canvas.db');
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    file_size INTEGER NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    details TEXT, -- JSON stored as text
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS remarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    learner_email TEXT NOT NULL,
    learner_name TEXT,
    learner_cohort TEXT NOT NULL,
    remark TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_uploads_user_id ON uploads(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
  CREATE INDEX IF NOT EXISTS idx_remarks_user_id ON remarks(user_id);
  CREATE INDEX IF NOT EXISTS idx_remarks_learner_email ON remarks(learner_email);
  CREATE INDEX IF NOT EXISTS idx_remarks_learner_cohort ON remarks(learner_cohort);
`);

// Prepare statements for common operations
const statements = {
  // User operations
  createUser: db.prepare('INSERT INTO users (id, name, email) VALUES (?, ?, ?)'),
  getUserById: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),

  // Upload operations
  createUpload: db.prepare('INSERT INTO uploads (id, user_id, filename, row_count, file_size) VALUES (?, ?, ?, ?, ?)'),
  getUploadsByUserId: db.prepare('SELECT * FROM uploads WHERE user_id = ? ORDER BY upload_time DESC'),

  // Activity operations
  createActivity: db.prepare('INSERT INTO activities (id, user_id, activity_type, details) VALUES (?, ?, ?, ?)'),
  getActivitiesByUserId: db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'),

  // Remark operations
  createRemark: db.prepare('INSERT INTO remarks (id, user_id, learner_email, learner_name, learner_cohort, remark) VALUES (?, ?, ?, ?, ?, ?)'),
  updateRemark: db.prepare('UPDATE remarks SET remark = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'),
  getRemarksByUserId: db.prepare('SELECT * FROM remarks WHERE user_id = ? ORDER BY created_at DESC'),
  getRemarkByKey: db.prepare('SELECT * FROM remarks WHERE user_id = ? AND learner_email = ? AND learner_cohort = ?'),
};

export { db, statements };