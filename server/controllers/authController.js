const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/db");

// Register
exports.register = (req, res) => {
  const { email, password, display_name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
    [email, hash, display_name || null],
    function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      //Generate a token so you can login automatically after creating account
      const token=jwt.sign(
        {id: this.lastID, email: email},
        process.env.JWT_SECRET,
        { expiresIn: "1d"}
      );

      //Returns the token
      res.status(201).json({token});
    }
  );
};

// Login
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = bcrypt.compareSync(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({ token });
    }
  );
};