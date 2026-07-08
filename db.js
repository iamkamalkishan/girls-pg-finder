// Database layer using better-sqlite3 (synchronous, simple, file-based)
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'app.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Users table (owners + customers)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,                -- null for Firebase/Google users
  auth_provider TEXT DEFAULT 'local', -- 'local' or 'firebase'
  role TEXT DEFAULT 'owner',    -- 'owner' or 'customer'
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

// PGs table (owned by a user)
db.exec(`
CREATE TABLE IF NOT EXISTS pgs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  type TEXT NOT NULL,           -- PG or Hostel
  price INTEGER NOT NULL,
  sharing TEXT,
  food INTEGER DEFAULT 0,
  safety_verified INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  address TEXT,
  phone TEXT,
  amenities TEXT DEFAULT '[]',   -- JSON array
  rules TEXT,
  nearby TEXT,
  images TEXT DEFAULT '[]',      -- JSON array
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
`);

// Inquiries (customer -> owner)
db.exec(`
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',     -- new | contacted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pg_id) REFERENCES pgs(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);
`);

// Reviews
db.exec(`
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pg_id INTEGER NOT NULL,
  user_name TEXT,
  rating INTEGER,
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pg_id) REFERENCES pgs(id)
);
`);

module.exports = db;
