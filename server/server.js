// AI Assisted (Claude by Anthropic)
require('dotenv').config();
const express = require('express');
// Import the PostgreSQL connection pool from our database file
const pool = require('./database/db');
const outfitRoutes = require("./routes/outfitRoutes");
const authRoutes = require("./routes/authRoutes");
const authRequired = require("./middleware/authRequired");
const clothingRoutes = require("./routes/clothingRoutes");
// Mount outfit routes
const path = require("path");
const axios = require("axios"); // Added for weather API functionality

// Resend setup for sending reset emails
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(express.json());
app.use("/outfits", outfitRoutes);
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

// Using National Weather Service's free weather API
// Route to a weather forecast using Denton's latitude and longitude
app.post('/weather', async (req, res) => {
    try {
      // Denton, TX coordinates
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;

      // Uses the lat and lon to gather data from NWS API
      const pointResponse = await axios.get(
        `https://api.weather.gov/points/${latitude},${longitude}`,
        {
          headers: {
            'User-Agent': 'OutfitPilot (student project)',
            'Accept': 'application/geo+json'
          }
        }
      );

      const forecastUrl = pointResponse.data.properties.forecast;

      // Call to get the data
      const forecastResponse = await axios.get(forecastUrl, {
        headers: {
          'User-Agent': 'OutfitPilot (student project)',
          'Accept': 'application/geo+json'
        }
      });

      const firstPeriod = forecastResponse.data.properties.periods[0];

      // Displays the gathered data
      res.json({
        city: 'Denton',
        temperature: firstPeriod.temperature,
        condition: firstPeriod.shortForecast,
        isDaytime: firstPeriod.isDaytime,
        windSpeed: firstPeriod.windSpeed
      });
    } catch (err) {
      console.error('Weather route error:', err.message);
      res.status(500).json({ error: 'Could not fetch weather data' });
    }
  });

// Root route
app.get('/', (req, res) => {
  res.send('Server Running');
});

// Forgot password - generates and emails a reset code
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email exists in database
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const userId = userResult.rows[0].id;

    // Generate a random 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const expiresAt = Date.now() + 15 * 60 * 1000;

    // Save code to database
    await pool.query(
      `INSERT INTO reset_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
      [userId, code, expiresAt]
    );

    // Send email
  await resend.emails.send({
    from: 'OutfitPilot <onboarding@resend.dev>',
    to: email,
    subject: 'OutfitPilot Password Reset Code',
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`
});

    res.json({ message: 'Reset code sent successfully' });

  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ error: 'Could not send reset email' });
  }
});

// Verify reset code
app.post('/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find the most recent unused code for this email
    const result = await pool.query(
      `SELECT rc.id, rc.expires_at FROM reset_codes rc
       JOIN users u ON rc.user_id = u.id
       WHERE u.email = $1 AND rc.code = $2 AND rc.used = false
       ORDER BY rc.created_at DESC LIMIT 1`,
      [email.toLowerCase(), code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const resetCode = result.rows[0];

    // Check if code is expired
    if (Date.now() > parseInt(resetCode.expires_at)) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    // Mark code as used
    await pool.query(
      `UPDATE reset_codes SET used = true WHERE id = $1`,
      [resetCode.id]
    );

    res.json({ message: 'Code verified successfully' });

  } catch (err) {
    console.error('Verify reset code error:', err.message);
    res.status(500).json({ error: 'Could not verify code' });
  }
});

// Reset password - updates the user's password
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Get user by email
    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const userId = userResult.rows[0].id;

    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the password
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: 'Password reset successfully' });

  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: 'Could not reset password' });
  }
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
