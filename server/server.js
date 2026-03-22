// AI Assisted (Claude by Anthropic)
require('dotenv').config();
const express = require('express');
// Import the PostgreSQL connection pool from our database file
const pool = require('./database/db');
const authRoutes = require("./routes/authRoutes");
const authRequired = require("./middleware/authRequired");
const clothingRoutes = require("./routes/clothingRoutes");
const path = require("path");

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;

// Status route - checks if server and database are online
app.get('/status', async (req, res) => {
  // Set a 2 second timeout in case the database is slow to respond
  const timeout = setTimeout(() => {
    res.status(504).json({
      server: "online",
      database: "unknown",
      message: "Status check timed out. The database might be asleep."
    });
  }, 2000);

  try {
    // Query the system_status table for the most recent message
    const result = await pool.query(
      `SELECT message, created_at FROM system_status ORDER BY id DESC LIMIT 1`
    );

    // Clear the timeout since we got a response
    clearTimeout(timeout);

    // Get the first row from the result
    const row = result.rows[0];

    return res.json({
      server: "online",
      database: "online",
      message: row?.message || "Database is online, but it is eerily quiet.",
      last_update: row?.created_at || null
    });

  } catch (err) {
    // Clear the timeout and return an error if the database query failed
    clearTimeout(timeout);
    return res.status(500).json({
      server: "online",
      database: "offline",
      error: err.message
    });
  }
});

// Existing test route
app.get('/test', (req, res) => {
  res.json({ message: "API is working" });
});

// Root route
app.get('/', (req, res) => {
  res.send('Server Running');
});

// Mount auth routes
app.use("/auth", authRoutes);

// Mount clothing routes
app.use("/clothing", clothingRoutes);

app.get("/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});