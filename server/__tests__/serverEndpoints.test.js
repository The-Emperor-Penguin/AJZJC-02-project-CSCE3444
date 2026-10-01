const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const bcrypt = require("bcrypt");

process.env.JWT_SECRET = "test-jwt-secret-xyz";
const pool = require("../database/db");

// Build a clean test harness for the core routes defined in server.js
const app = express();
app.use(express.json());

// Resend mock
let sentEmails = [];
const mockResend = {
  emails: {
    send: async (payload) => {
      sentEmails.push(payload);
      return { id: "mock-email-id" };
    }
  }
};

// Route: /status
app.get('/status', async (req, res) => {
  const timeout = setTimeout(() => {
    res.status(504).json({
      server: "online",
      database: "unknown",
      message: "Status check timed out. The database might be asleep."
    });
  }, 2000);

  try {
    const result = await pool.query(
      `SELECT message, created_at FROM system_status ORDER BY id DESC LIMIT 1`
    );
    clearTimeout(timeout);
    const row = result.rows[0];
    return res.json({
      server: "online",
      database: "online",
      message: row?.message || "Database is online, but it is eerily quiet.",
      last_update: row?.created_at || null
    });
  } catch (err) {
    clearTimeout(timeout);
    return res.status(500).json({
      server: "online",
      database: "offline",
      error: err.message
    });
  }
});

// Route: /test
app.get('/test', (req, res) => {
  res.json({ message: "API is working" });
});

// Route: /
app.get('/', (req, res) => {
  res.send('Server Running');
});

// Route: /auth/forgot-password
app.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const userId = userResult.rows[0].id;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000;

    await pool.query(
      `INSERT INTO reset_codes (user_id, code, expires_at) VALUES ($1, $2, $3)`,
      [userId, code, expiresAt]
    );

    await mockResend.emails.send({
      from: 'OutfitPilot <noreply@ammanuelgerena.it.com>',
      to: email,
      subject: 'OutfitPilot Password Reset Code',
      text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`
    });

    res.json({ message: 'Reset code sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not send reset email' });
  }
});

// Route: /auth/verify-reset-code
app.post('/auth/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

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
    if (Date.now() > parseInt(resetCode.expires_at)) {
      return res.status(400).json({ error: 'Code has expired' });
    }

    await pool.query(
      `UPDATE reset_codes SET used = true WHERE id = $1`,
      [resetCode.id]
    );

    res.json({ message: 'Code verified successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not verify code' });
  }
});

// Route: /auth/reset-password
app.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'Email and new password are required' });
    }

    const userResult = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with that email' });
    }

    const userId = userResult.rows[0].id;
    const hashedPassword = await bcrypt.hash(new_password, 10);

    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not reset password' });
  }
});

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("White-Box: Server Core Endpoints & Password Reset Flow", () => {
  let originalQuery;

  beforeEach(() => {
    originalQuery = pool.query;
    sentEmails = [];
  });

  // /status tests
  describe("GET /status", () => {
    test("Branch: DB online with custom status message -> 200", async () => {
      pool.query = async () => ({
        rows: [{ message: "All systems nominal", created_at: "2026-03-24 10:00:00" }]
      });

      const res = await fetch(`${baseUrl}/status`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.server, "online");
      assert.strictEqual(data.database, "online");
      assert.strictEqual(data.message, "All systems nominal");
    });

    test("Branch: DB online but empty message -> 200 with fallback message", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/status`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.message, "Database is online, but it is eerily quiet.");
    });

    test("Exception Path: DB offline / throws error -> 500", async () => {
      pool.query = async () => { throw new Error("DB connection refused"); };

      const res = await fetch(`${baseUrl}/status`);
      assert.strictEqual(res.status, 500);
      const data = await res.json();
      assert.strictEqual(data.database, "offline");
    });
  });

  // Basic routes
  test("GET /test -> 200 API is working", async () => {
    const res = await fetch(`${baseUrl}/test`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.message, "API is working");
  });

  test("GET / -> 200 Server Running", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const text = await res.text();
    assert.strictEqual(text, "Server Running");
  });

  // Forgot password flow
  describe("POST /auth/forgot-password", () => {
    test("MCC Condition 1: Missing email -> 400 Email is required", async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
    });

    test("Branch: Email not registered in users table -> 404", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "unknown@example.com" })
      });
      assert.strictEqual(res.status, 404);
    });

    test("Branch: Valid email -> generates code, inserts into DB, sends email -> 200", async () => {
      let insertedResetCode = null;
      pool.query = async (text, params) => {
        if (text.includes("SELECT id FROM users")) {
          return { rows: [{ id: 45 }] };
        }
        if (text.includes("INSERT INTO reset_codes")) {
          insertedResetCode = params;
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com" })
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(insertedResetCode[0], 45); // user_id
      assert.strictEqual(typeof insertedResetCode[1], "string");
      assert.strictEqual(insertedResetCode[1].length, 6); // 6-digit code
      assert.strictEqual(sentEmails.length, 1);
      assert.strictEqual(sentEmails[0].to, "pilot@example.com");
    });
  });

  // Verify reset code flow
  describe("POST /auth/verify-reset-code", () => {
    test("MCC Condition: Missing code -> 400", async () => {
      const res = await fetch(`${baseUrl}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com" })
      });
      assert.strictEqual(res.status, 400);
    });

    test("Branch: Invalid code or already used -> 400 Invalid or expired code", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com", code: "000000" })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "Invalid or expired code");
    });

    test("Branch: Expired code (Date.now() > expires_at) -> 400 Code has expired", async () => {
      const expiredTimestamp = Date.now() - 10000; // 10s ago
      pool.query = async () => ({
        rows: [{ id: 1, expires_at: expiredTimestamp.toString() }]
      });

      const res = await fetch(`${baseUrl}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com", code: "123456" })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "Code has expired");
    });

    test("Branch: Valid code -> marks used = true and returns 200", async () => {
      const validFutureTimestamp = Date.now() + 600000; // 10m future
      let markedUsed = false;

      pool.query = async (text, params) => {
        if (text.includes("SELECT rc.id")) {
          return { rows: [{ id: 88, expires_at: validFutureTimestamp.toString() }] };
        }
        if (text.includes("UPDATE reset_codes SET used = true")) {
          markedUsed = true;
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com", code: "123456" })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(markedUsed, true);
    });
  });

  // Reset password flow
  describe("POST /auth/reset-password", () => {
    test("MCC Condition: Missing new_password -> 400", async () => {
      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com" })
      });
      assert.strictEqual(res.status, 400);
    });

    test("Branch: User not found -> 404", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ghost@example.com", new_password: "NewPassword123" })
      });
      assert.strictEqual(res.status, 404);
    });

    test("Branch: Valid reset -> updates password_hash with bcrypt and returns 200", async () => {
      let updatedHash = null;
      pool.query = async (text, params) => {
        if (text.includes("SELECT id FROM users")) {
          return { rows: [{ id: 70 }] };
        }
        if (text.includes("UPDATE users SET password_hash")) {
          updatedHash = params[0];
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "pilot@example.com", new_password: "BrandNewSecurePassword!" })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.message, "Password reset successfully");
      assert.ok(bcrypt.compareSync("BrandNewSecurePassword!", updatedHash));
    });
  });
});
