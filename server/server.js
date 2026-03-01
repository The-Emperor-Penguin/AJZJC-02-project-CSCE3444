require('dotenv').config();
const express = require('express');
const db = require('./database/db');
const authRoutes = require("./routes/authRoutes");
const authRequired = require("./middleware/authRequired");
const clothingRoutes = require("./routes/clothingRoutes");
const path = require("path");

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;

app.get('/status', (req, res) => {
  const timeout = setTimeout(() => {
    res.status(504).json({
      server: "online",
      database: "unknown",
      message: "Status check timed out. The database might be asleep."
    });
  }, 2000);

  db.get(
    `SELECT message, created_at FROM system_status ORDER BY id DESC LIMIT 1`,
    [],
    (err, row) => {
      clearTimeout(timeout);

      if (err) {
        return res.status(500).json({
          server: "online",
          database: "offline",
          error: err.message
        });
      }

      return res.json({
        server: "online",
        database: "online",
        message: row?.message || "Database is online, but it is eerily quiet.",
        last_update: row?.created_at || null
      });
    }
  );
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