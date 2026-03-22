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