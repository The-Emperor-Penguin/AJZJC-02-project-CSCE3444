// Import the Pool class from the 'pg' package (PostgreSQL driver)
// A Pool manages multiple database connections efficiently
const { Pool } = require('pg');

// Create a new connection pool using the DATABASE_URL from our .env file
// SSL is required when running on Railway (production) but not locally
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// This function creates all our tables if they don't already exist
// It runs once when the server starts up
const initDB = async () => {
  try {
    // Create the users table
    // SERIAL = auto incrementing integer (replaces SQLite's AUTOINCREMENT)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    `);

    // Add new profile columns to users table if they don't already exist
    // ALTER TABLE ADD COLUMN IF NOT EXISTS prevents errors if columns already exist
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS formality_preference TEXT DEFAULT 'casual'`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT`);

    // Create the clothing items table
    // References users(id) means each clothing item belongs to a user
    // ON DELETE CASCADE means if a user is deleted, their clothes are too
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clothing_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')),
        updated_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    `);

    // Create the item photos table
    // Each clothing item can have multiple photos
    // ON DELETE CASCADE means if a clothing item is deleted, its photos are too
    await pool.query(`
      CREATE TABLE IF NOT EXISTS item_photos (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
        uri TEXT NOT NULL,
        is_primary INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    `);

    // Create outfit_logs table
    // Stores one row each time a user logs a worn outfit
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outfit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date_worn TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS')),
        weather_temperature INTEGER,
        weather_condition TEXT,
        weather_city TEXT,
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    `);

    // Create outfit_log_items table
    // Links each outfit log to the clothing items that were worn
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outfit_log_items (
        id SERIAL PRIMARY KEY,
        outfit_log_id INTEGER NOT NULL REFERENCES outfit_logs(id) ON DELETE CASCADE,
        clothing_item_id INTEGER NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE
      )
    `);

    // Create the reset_codes table
    // Stores password reset codes with expiry times
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reset_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TEXT NOT NULL DEFAULT (to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))
      )
    `);

    // Create the system status table
    // Used to check if the server and database are online
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_status (
        id SERIAL PRIMARY KEY,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Insert a test message into system_status so we know the DB is working
    // $1 is a placeholder for the first parameter (prevents SQL injection)
    await pool.query(
      `INSERT INTO system_status (message, created_at) VALUES ($1, to_char(NOW(), 'YYYY-MM-DD HH24:MI:SS'))`,
      ["Wardrobe vault initialized. No goblins detected."]
    );

    console.log('Database initialized successfully');
  } catch (err) {
    // If anything goes wrong during initialization, log the error
    console.error('Database initialization error:', err.message);
  }
};

// Run the initialization function when the server starts
initDB();

// Export the pool so other files can use it to query the database
module.exports = pool;