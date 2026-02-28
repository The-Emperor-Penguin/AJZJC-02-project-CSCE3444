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

// Minimal “proof it works” table
db.serialize(() => {
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