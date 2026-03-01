const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// This creates (or opens) a local database file at server/database/outfitpilot.sqlite
const dbPath = path.join(__dirname, 'outfitpilot.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected:', dbPath);
  }
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Clothing items table (MVP spine)
  db.run(`
    CREATE TABLE IF NOT EXISTS clothing_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      layer_role TEXT,
      color_primary TEXT,
      color_secondary TEXT,
      pattern TEXT,
      material TEXT,
      formality_level INTEGER DEFAULT 0,
      warmth_score INTEGER DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'clean',
      favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS item_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    uri TEXT NOT NULL,
    is_primary INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (item_id) REFERENCES clothing_items(id) ON DELETE CASCADE
  )
`);

  // Minimal “proof it works” table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.run(
    `INSERT INTO system_status (message, created_at) VALUES (?, datetime('now'))`,
    ["Wardrobe vault initialized. No goblins detected."]
  );
});

module.exports = db;