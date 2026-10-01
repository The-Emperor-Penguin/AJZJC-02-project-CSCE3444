const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-jwt-secret-xyz";
const pool = require("../database/db");
const clothingRoutes = require("../routes/clothingRoutes");

const app = express();
app.use(express.json());
app.use("/clothing", clothingRoutes);

let server;
let baseUrl;
const testToken = jwt.sign({ id: 10, email: "pilot@example.com" }, process.env.JWT_SECRET);

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/clothing`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("White-Box: clothingRoutes HTTP Integration & Logic", () => {
  let originalQuery;

  beforeEach(() => {
    originalQuery = pool.query;
  });

  // -------------------------------------------------------------
  // POST /clothing
  // -------------------------------------------------------------
  describe("POST /clothing", () => {
    test("MCC Condition 1: Missing name -> 400", async () => {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({ category: "t-shirt" })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "name and category required");
    });

    test("MCC Condition 2: Missing category -> 400", async () => {
      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({ name: "My Favorite Shirt" })
      });

      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.error, "name and category required");
    });

    test("Branch: Successful creation with default values -> 201", async () => {
      let queryParams = null;
      pool.query = async (text, params) => {
        queryParams = params;
        return { rows: [{ id: 501 }] };
      };

      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({
          name: "Casual Tee",
          category: "t-shirt"
        })
      });

      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.id, 501);

      // Verify nullish coalescing defaults
      assert.strictEqual(queryParams[0], 10); // user_id from token
      assert.strictEqual(queryParams[1], "Casual Tee");
      assert.strictEqual(queryParams[2], "t-shirt");
      assert.strictEqual(queryParams[9], 0); // formality_level ?? 0
      assert.strictEqual(queryParams[10], 5); // warmth_score ?? 5
      assert.strictEqual(queryParams[11], "clean"); // status || "clean"
      assert.strictEqual(queryParams[12], 0); // favorite ? 1 : 0
    });

    test("Branch: Successful creation with custom values and favorite=true -> 201", async () => {
      let queryParams = null;
      pool.query = async (text, params) => {
        queryParams = params;
        return { rows: [{ id: 502 }] };
      };

      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({
          name: "Black Blazer",
          category: "blazer",
          color_primary: "black",
          formality_level: 4,
          warmth_score: 8,
          status: "clean",
          favorite: true
        })
      });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(queryParams[9], 4);
      assert.strictEqual(queryParams[10], 8);
      assert.strictEqual(queryParams[12], 1); // favorite 1
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB insert error"); };

      const res = await fetch(`${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({ name: "Hat", category: "accessory" })
      });

      assert.strictEqual(res.status, 500);
      const data = await res.json();
      assert.strictEqual(data.error, "DB insert error");
    });
  });

  // -------------------------------------------------------------
  // GET /clothing
  // -------------------------------------------------------------
  describe("GET /clothing", () => {
    test("Branch: Successfully fetches items with joined photo uri -> 200", async () => {
      pool.query = async () => ({
        rows: [
          { id: 1, name: "Shirt", category: "t-shirt", primary_photo_uri: "uploads/pic.jpg" }
        ]
      });

      const res = await fetch(`${baseUrl}`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.items.length, 1);
      assert.strictEqual(data.items[0].primary_photo_uri, "uploads/pic.jpg");
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB read error"); };

      const res = await fetch(`${baseUrl}`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 500);
    });
  });

  // -------------------------------------------------------------
  // PATCH /clothing/:id/status
  // -------------------------------------------------------------
  describe("PATCH /clothing/:id/status", () => {
    test("Branch: Item not found / unowned -> 404", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/999/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error, "Item not found");
    });

    test("Branch: Toggle status from clean to dirty -> 200", async () => {
      let updatedStatus = null;
      pool.query = async (text, params) => {
        if (text.includes("SELECT id, status")) {
          return { rows: [{ id: 10, status: "clean" }] };
        }
        if (text.includes("UPDATE clothing_items SET status")) {
          updatedStatus = params[0];
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/10/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "dirty");
      assert.strictEqual(updatedStatus, "dirty");
    });

    test("Branch: Toggle status from dirty to clean -> 200", async () => {
      let updatedStatus = null;
      pool.query = async (text, params) => {
        if (text.includes("SELECT id, status")) {
          return { rows: [{ id: 11, status: "dirty" }] };
        }
        if (text.includes("UPDATE clothing_items SET status")) {
          updatedStatus = params[0];
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/11/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "clean");
      assert.strictEqual(updatedStatus, "clean");
    });
  });

  // -------------------------------------------------------------
  // DELETE /clothing/:id/delete
  // -------------------------------------------------------------
  describe("DELETE /clothing/:id/delete", () => {
    test("Branch: Item not found / unowned -> 404", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/999/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error, "Item not found");
    });

    test("Branch: Successfully deletes clothing item and photos -> 200", async () => {
      pool.query = async (text) => {
        if (text.includes("SELECT id FROM clothing_items")) {
          return { rows: [{ id: 10 }] };
        }
        if (text.includes("SELECT uri FROM item_photos")) {
          return { rows: [{ uri: "uploads/non_existent_pic.jpg" }] };
        }
        return { rows: [] };
      };

      const res = await fetch(`${baseUrl}/10/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${testToken}` }
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, "Item deleted successfully");
    });
  });

  // -------------------------------------------------------------
  // PUT /clothing/:id/edit
  // -------------------------------------------------------------
  describe("PUT /clothing/:id/edit", () => {
    test("Branch: Item not found -> 404", async () => {
      pool.query = async () => ({ rows: [] });

      const res = await fetch(`${baseUrl}/999/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({ name: "Updated" })
      });

      assert.strictEqual(res.status, 404);
    });

    test("Branch: Partial update preserves current values -> 200", async () => {
      const currentDbRecord = {
        id: 10,
        name: "Old Name",
        category: "jeans",
        subcategory: "slim",
        layer_role: "bottom",
        color_primary: "blue",
        color_secondary: null,
        pattern: "solid",
        material: "denim",
        formality_level: 1,
        warmth_score: 5,
        status: "clean",
        favorite: 0
      };

      let updateParams = null;
      pool.query = async (text, params) => {
        if (text.includes("SELECT id FROM clothing_items WHERE id = $1 AND user_id = $2")) {
          return { rows: [{ id: 10 }] };
        }
        if (text.includes("SELECT * FROM clothing_items WHERE id = $1")) {
          return { rows: [currentDbRecord] };
        }
        if (text.includes("UPDATE clothing_items SET")) {
          updateParams = params;
          return { rows: [] };
        }
      };

      const res = await fetch(`${baseUrl}/10/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${testToken}`
        },
        body: JSON.stringify({
          name: "Updated Jeans Name",
          favorite: true // test boolean conversion to 1
        })
      });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(updateParams[0], "Updated Jeans Name");
      assert.strictEqual(updateParams[1], "jeans"); // preserved current category
      assert.strictEqual(updateParams[11], 1); // favorite converted to 1
    });
  });
});
