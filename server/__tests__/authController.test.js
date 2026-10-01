const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-jwt-secret-xyz";
const pool = require("../database/db");
const authController = require("../controllers/authController");

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

describe("White-Box: authController Unit Tests", () => {
  let originalQuery;

  beforeEach(() => {
    originalQuery = pool.query;
  });

  // -------------------------------------------------------------
  // register tests
  // -------------------------------------------------------------
  describe("register()", () => {
    test("MCC Condition 1: Missing email -> 400 Email and password required", async () => {
      const req = { body: { password: "password123" } };
      const res = createMockRes();

      await authController.register(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "Email and password required" });
    });

    test("MCC Condition 2: Missing password -> 400 Email and password required", async () => {
      const req = { body: { email: "user@test.com" } };
      const res = createMockRes();

      await authController.register(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "Email and password required" });
    });

    test("Branch: Successful registration with display_name -> 201 with JWT token", async () => {
      let executedQuery = null;
      let queryParams = null;

      pool.query = async (text, params) => {
        executedQuery = text;
        queryParams = params;
        return { rows: [{ id: 101 }] };
      };

      const req = {
        body: {
          email: "newuser@example.com",
          password: "SecurePassword1!",
          display_name: "Pilot One"
        }
      };
      const res = createMockRes();

      await authController.register(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.body.token, "Token should be present in response");
      
      // Verify JWT payload
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.id, 101);
      assert.strictEqual(decoded.email, "newuser@example.com");

      // Verify display_name passed to DB
      assert.strictEqual(queryParams[0], "newuser@example.com");
      assert.ok(bcrypt.compareSync("SecurePassword1!", queryParams[1]));
      assert.strictEqual(queryParams[2], "Pilot One");
    });

    test("Branch: Successful registration without display_name -> falls back to null", async () => {
      let queryParams = null;

      pool.query = async (text, params) => {
        queryParams = params;
        return { rows: [{ id: 102 }] };
      };

      const req = {
        body: {
          email: "pilot2@example.com",
          password: "SecurePassword2!"
        }
      };
      const res = createMockRes();

      await authController.register(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(queryParams[2], null);
    });

    test("Exception Path: Duplicate email (DB unique violation) -> 400 with DB error message", async () => {
      pool.query = async () => {
        throw new Error('duplicate key value violates unique constraint "users_email_key"');
      };

      const req = {
        body: {
          email: "duplicate@example.com",
          password: "password123"
        }
      };
      const res = createMockRes();

      await authController.register(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.ok(res.body.error.includes("duplicate key"));
    });
  });

  // -------------------------------------------------------------
  // login tests
  // -------------------------------------------------------------
  describe("login()", () => {
    test("Branch: User not found in DB -> 401 Invalid credentials", async () => {
      pool.query = async () => ({ rows: [] });

      const req = { body: { email: "ghost@example.com", password: "any" } };
      const res = createMockRes();

      await authController.login(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: "Invalid credentials" });
    });

    test("Branch: Incorrect password -> 401 Invalid credentials", async () => {
      const realPasswordHash = bcrypt.hashSync("correct-pass", 10);
      pool.query = async () => ({
        rows: [{ id: 5, email: "user@example.com", password_hash: realPasswordHash }]
      });

      const req = { body: { email: "user@example.com", password: "wrong-password" } };
      const res = createMockRes();

      await authController.login(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: "Invalid credentials" });
    });

    test("Branch: Valid credentials -> 200 with JWT token", async () => {
      const realPasswordHash = bcrypt.hashSync("correct-pass", 10);
      pool.query = async () => ({
        rows: [{ id: 5, email: "user@example.com", password_hash: realPasswordHash }]
      });

      const req = { body: { email: "user@example.com", password: "correct-pass" } };
      const res = createMockRes();

      await authController.login(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.token);

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      assert.strictEqual(decoded.id, 5);
      assert.strictEqual(decoded.email, "user@example.com");
    });

    test("Exception Path: Database query failure -> 401 Invalid credentials", async () => {
      pool.query = async () => {
        throw new Error("Connection lost");
      };

      const req = { body: { email: "user@example.com", password: "password" } };
      const res = createMockRes();

      await authController.login(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: "Invalid credentials" });
    });
  });

  // -------------------------------------------------------------
  // getProfile tests
  // -------------------------------------------------------------
  describe("getProfile()", () => {
    test("Branch: User not found -> 404 User not found", async () => {
      pool.query = async () => ({ rows: [] });

      const req = { user: { id: 999 } };
      const res = createMockRes();

      await authController.getProfile(req, res);

      assert.strictEqual(res.statusCode, 404);
      assert.deepStrictEqual(res.body, { error: "User not found" });
    });

    test("Branch: User found -> 200 with profile object", async () => {
      const mockProfile = {
        id: 42,
        email: "pilot@example.com",
        display_name: "Test Pilot",
        city: "Denton",
        state: "TX",
        formality_preference: "casual",
        profile_photo: null
      };
      pool.query = async () => ({ rows: [mockProfile] });

      const req = { user: { id: 42 } };
      const res = createMockRes();

      await authController.getProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { user: mockProfile });
    });

    test("Exception Path: DB error -> 500 with error message", async () => {
      pool.query = async () => { throw new Error("DB read error"); };

      const req = { user: { id: 42 } };
      const res = createMockRes();

      await authController.getProfile(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB read error");
    });
  });

  // -------------------------------------------------------------
  // updateProfile tests
  // -------------------------------------------------------------
  describe("updateProfile()", () => {
    test("Branch: Successful update -> 200 with updated fields", async () => {
      let queryParams = null;
      pool.query = async (text, params) => {
        queryParams = params;
        return {
          rows: [{
            id: 42,
            email: "pilot@example.com",
            display_name: "New Name",
            city: "Dallas",
            state: "TX",
            formality_preference: "business_casual"
          }]
        };
      };

      const req = {
        user: { id: 42 },
        body: {
          display_name: "New Name",
          city: "Dallas",
          state: "TX",
          formality_preference: "business_casual"
        }
      };
      const res = createMockRes();

      await authController.updateProfile(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.user.display_name, "New Name");
      assert.strictEqual(queryParams[4], 42); // req.user.id
    });

    test("Exception Path: DB error on update -> 500", async () => {
      pool.query = async () => { throw new Error("DB write error"); };

      const req = { user: { id: 42 }, body: {} };
      const res = createMockRes();

      await authController.updateProfile(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB write error");
    });
  });

  // -------------------------------------------------------------
  // changePassword tests
  // -------------------------------------------------------------
  describe("changePassword()", () => {
    test("MCC Condition 1: Missing current_password -> 400", async () => {
      const req = { user: { id: 42 }, body: { new_password: "NewPass123!" } };
      const res = createMockRes();

      await authController.changePassword(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "Current and new password required" });
    });

    test("MCC Condition 2: Missing new_password -> 400", async () => {
      const req = { user: { id: 42 }, body: { current_password: "OldPass123!" } };
      const res = createMockRes();

      await authController.changePassword(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "Current and new password required" });
    });

    test("Branch: Current password mismatch -> 401 Current password is incorrect", async () => {
      const storedHash = bcrypt.hashSync("ActualOldPass", 10);
      pool.query = async () => ({ rows: [{ id: 42, password_hash: storedHash }] });

      const req = {
        user: { id: 42 },
        body: { current_password: "WrongOldPass", new_password: "BrandNewPass" }
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: "Current password is incorrect" });
    });

    test("Branch: Correct current password -> updates password_hash and returns 200", async () => {
      const storedHash = bcrypt.hashSync("ActualOldPass", 10);
      let updateExecuted = false;
      let newHashParam = null;

      pool.query = async (text, params) => {
        if (text.includes("SELECT * FROM users")) {
          return { rows: [{ id: 42, password_hash: storedHash }] };
        }
        if (text.includes("UPDATE users SET password_hash")) {
          updateExecuted = true;
          newHashParam = params[0];
          return { rows: [] };
        }
      };

      const req = {
        user: { id: 42 },
        body: { current_password: "ActualOldPass", new_password: "BrandNewPass" }
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { message: "Password updated successfully" });
      assert.strictEqual(updateExecuted, true);
      assert.ok(bcrypt.compareSync("BrandNewPass", newHashParam));
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB connection timeout"); };

      const req = {
        user: { id: 42 },
        body: { current_password: "OldPass", new_password: "NewPass" }
      };
      const res = createMockRes();

      await authController.changePassword(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB connection timeout");
    });
  });
});
