const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// Import the PostgreSQL connection pool from our database file
const pool = require("../database/db");

// Register
// async because we're waiting for database responses
exports.register = async (req, res) => {
  const { email, password, display_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Hash the password before storing it
  const hash = bcrypt.hashSync(password, 10);

  try {
    // Insert the new user into the database
    // $1, $2, $3 are placeholders (PostgreSQL uses $ instead of ?)
    // RETURNING id tells PostgreSQL to give us back the new user's id
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id",
      [email, hash, display_name || null]
    );

    // Generate a token so the user is logged in automatically after registering
    const token = jwt.sign(
      { id: result.rows[0].id, email: email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return the token
    res.status(201).json({ token });

  } catch (err) {
    // If the email already exists or anything else goes wrong
    return res.status(400).json({ error: err.message });
  }
};

// Login
// async because we're waiting for database responses
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Look up the user by email
    // $1 is a placeholder for the email value
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // rows[0] is the first (and should be only) result returned
    const user = result.rows[0];

    // If no user was found, return an error
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the entered password against the stored hash
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate and return a JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });

  } catch (err) {
    // If anything goes wrong with the database query
    return res.status(401).json({ error: "Invalid credentials" });
  }
};

// Get Profile
// Returns the current user's profile information
exports.getProfile = async (req, res) => {
  try {
    // Get the user's info from the database using their id from the token
    const result = await pool.query(
      "SELECT id, email, display_name, city, state, formality_preference, profile_photo FROM users WHERE id = $1",
      [req.user.id]
    );

    // If no user found return an error
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user's profile info
    res.json({ user });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update Profile
// Allows the user to update their display name, city, state, and formality preference
exports.updateProfile = async (req, res) => {
  // Get the fields the user wants to update from the request body
  const { display_name, city, state, formality_preference } = req.body;

  try {
    // Update the user's profile in the database
    const result = await pool.query(
      `UPDATE users SET 
        display_name = COALESCE($1, display_name),
        city = COALESCE($2, city),
        state = COALESCE($3, state),
        formality_preference = COALESCE($4, formality_preference)
      WHERE id = $5
      RETURNING id, email, display_name, city, state, formality_preference`,
      [display_name, city, state, formality_preference, req.user.id]
    );

    // Return the updated user profile
    res.json({ user: result.rows[0] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Change Password
// Allows the user to change their password
exports.changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;

  // Make sure both fields are provided
  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Current and new password required" });
  }

  try {
    // Get the user's current password hash from the database
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [req.user.id]
    );

    const user = result.rows[0];

    // Verify the current password is correct before allowing a change
    const valid = bcrypt.compareSync(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash the new password before storing it
    const newHash = bcrypt.hashSync(new_password, 10);

    // Update the password in the database
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [newHash, req.user.id]
    );

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};