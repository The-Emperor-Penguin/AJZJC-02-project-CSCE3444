const { test, describe, before } = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret-key-12345";
const authRequired = require("../middleware/authRequired");

function createMockRes() {
  const res = {
    statusCode: null,
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

describe("White-Box: authRequired Middleware", () => {
  test("Branch 1: Header missing entirely -> 401 Missing Bearer token", () => {
    const req = { headers: {} };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Missing Bearer token" });
    assert.strictEqual(nextCalled, false);
  });

  test("Branch 2: Header does not start with 'Bearer ' -> 401 Missing Bearer token", () => {
    const req = { headers: { authorization: "Basic dXNlcjpwYXNz" } };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Missing Bearer token" });
    assert.strictEqual(nextCalled, false);
  });

  test("Branch 3: Malformed JWT token string -> 401 Invalid or expired token", () => {
    const req = { headers: { authorization: "Bearer malformed.token.value" } };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Invalid or expired token" });
    assert.strictEqual(nextCalled, false);
  });

  test("Branch 4: Token signed with incorrect secret -> 401 Invalid or expired token", () => {
    const foreignToken = jwt.sign({ id: 1, email: "user@test.com" }, "wrong-secret");
    const req = { headers: { authorization: `Bearer ${foreignToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Invalid or expired token" });
    assert.strictEqual(nextCalled, false);
  });

  test("Branch 5: Expired token -> 401 Invalid or expired token", () => {
    // Generate an expired token by setting negative expiresIn
    const expiredToken = jwt.sign({ id: 1, email: "user@test.com" }, process.env.JWT_SECRET, { expiresIn: "0s" });
    
    // Small delay to ensure expiration
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, 401);
    assert.deepStrictEqual(res.body, { error: "Invalid or expired token" });
    assert.strictEqual(nextCalled, false);
  });

  test("Branch 6: Valid token -> attaches payload to req.user and invokes next()", () => {
    const userPayload = { id: 42, email: "pilot@example.com" };
    const validToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: "1h" });
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = createMockRes();
    let nextCalled = false;

    authRequired(req, res, () => { nextCalled = true; });

    assert.strictEqual(res.statusCode, null);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.id, 42);
    assert.strictEqual(req.user.email, "pilot@example.com");
  });
});
