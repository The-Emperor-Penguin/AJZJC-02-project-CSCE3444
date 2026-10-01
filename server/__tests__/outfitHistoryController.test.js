const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert");

const pool = require("../database/db");
const outfitController = require("../controllers/outfitHistoryController");

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

describe("White-Box: outfitHistoryController Unit Tests", () => {
  let originalQuery;

  beforeEach(() => {
    originalQuery = pool.query;
  });

  // -------------------------------------------------------------
  // getHistory()
  // -------------------------------------------------------------
  describe("getHistory()", () => {
    test("Branch: User has 0 outfit logs -> 200 with empty history array", async () => {
      pool.query = async (text) => {
        if (text.includes("FROM outfit_logs")) {
          return { rows: [] };
        }
      };

      const req = { user: { id: 1 } };
      const res = createMockRes();

      await outfitController.getHistory(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { history: [] });
    });

    test("Branch: User has logs with items and photos -> 200 with aggregated history", async () => {
      pool.query = async (text, params) => {
        if (text.includes("FROM outfit_logs")) {
          return {
            rows: [
              {
                id: 10,
                date_worn: "2026-03-24T12:00:00Z",
                weather_temperature: 65,
                weather_condition: "Sunny",
                weather_city: "Denton"
              }
            ]
          };
        }
        if (text.includes("FROM outfit_log_items")) {
          return {
            rows: [
              {
                outfit_log_id: 10,
                id: 101,
                name: "Blue Jeans",
                category: "jeans",
                color_primary: "blue",
                photo_url: "uploads/jeans.jpg"
              },
              {
                outfit_log_id: 10,
                id: 102,
                name: "White Tee",
                category: "t-shirt",
                color_primary: "white",
                photo_url: null
              }
            ]
          };
        }
      };

      const req = { user: { id: 1 } };
      const res = createMockRes();

      await outfitController.getHistory(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.history.length, 1);
      const entry = res.body.history[0];
      assert.strictEqual(entry.id, 10);
      assert.strictEqual(entry.items.length, 2);
      assert.ok(entry.items[0].photo_url.includes("uploads/jeans.jpg"));
      assert.strictEqual(entry.items[1].photo_url, null);
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB read error"); };

      const req = { user: { id: 1 } };
      const res = createMockRes();

      await outfitController.getHistory(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB read error");
    });
  });

  // -------------------------------------------------------------
  // logOutfit()
  // -------------------------------------------------------------
  describe("logOutfit()", () => {
    test("MCC Condition: item_ids is not an array -> 400", async () => {
      const req = { user: { id: 1 }, body: { item_ids: "not-an-array" } };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "item_ids must be a non-empty array" });
    });

    test("MCC Condition: item_ids is empty array -> 400", async () => {
      const req = { user: { id: 1 }, body: { item_ids: [] } };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 400);
      assert.deepStrictEqual(res.body, { error: "item_ids must be a non-empty array" });
    });

    test("Branch: Items not owned by user -> 403 One or more items do not belong to you", async () => {
      // User sent [101, 102], but DB only finds 1 item owned by user 1
      pool.query = async (text) => {
        if (text.includes("FROM clothing_items WHERE id = ANY")) {
          return { rows: [{ id: 101 }] };
        }
      };

      const req = { user: { id: 1 }, body: { item_ids: [101, 102] } };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(res.body, { error: "One or more items do not belong to you" });
    });

    test("Branch: All items owned, custom date_worn provided -> 201 with log ID", async () => {
      let insertedLogId = 77;
      let insertedItems = [];

      pool.query = async (text, params) => {
        if (text.includes("FROM clothing_items WHERE id = ANY")) {
          return { rows: [{ id: 101 }, { id: 102 }] };
        }
        if (text.includes("INSERT INTO outfit_logs")) {
          return { rows: [{ id: insertedLogId }] };
        }
        if (text.includes("INSERT INTO outfit_log_items")) {
          insertedItems = params;
          return { rows: [] };
        }
      };

      const customDate = "2026-03-20T08:30:00Z";
      const req = {
        user: { id: 1 },
        body: { item_ids: [101, 102], date_worn: customDate }
      };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.body.id, 77);
      assert.strictEqual(res.body.date_worn, customDate);
      assert.strictEqual(insertedItems[0], 77);
      assert.strictEqual(insertedItems[1], 101);
      assert.strictEqual(insertedItems[2], 102);
    });

    test("Branch: date_worn omitted -> defaults to current ISO string", async () => {
      pool.query = async (text) => {
        if (text.includes("FROM clothing_items")) return { rows: [{ id: 101 }] };
        if (text.includes("INSERT INTO outfit_logs")) return { rows: [{ id: 88 }] };
        if (text.includes("INSERT INTO outfit_log_items")) return { rows: [] };
      };

      const req = { user: { id: 1 }, body: { item_ids: [101] } };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.ok(res.body.date_worn);
      assert.strictEqual(new Date(res.body.date_worn).getFullYear(), 2026);
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("Insert failed"); };

      const req = { user: { id: 1 }, body: { item_ids: [101] } };
      const res = createMockRes();

      await outfitController.logOutfit(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "Insert failed");
    });
  });

  // -------------------------------------------------------------
  // deleteHistoryEntry()
  // -------------------------------------------------------------
  describe("deleteHistoryEntry()", () => {
    test("Branch: Entry not found or unowned -> 404 Entry not found", async () => {
      pool.query = async () => ({ rows: [] });

      const req = { user: { id: 1 }, params: { id: "99" } };
      const res = createMockRes();

      await outfitController.deleteHistoryEntry(req, res);

      assert.strictEqual(res.statusCode, 404);
      assert.deepStrictEqual(res.body, { error: "Entry not found" });
    });

    test("Branch: Entry deleted successfully -> 200", async () => {
      pool.query = async () => ({ rows: [{ id: 99 }] });

      const req = { user: { id: 1 }, params: { id: "99" } };
      const res = createMockRes();

      await outfitController.deleteHistoryEntry(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(res.body, { message: "Entry deleted successfully" });
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB delete error"); };

      const req = { user: { id: 1 }, params: { id: "99" } };
      const res = createMockRes();

      await outfitController.deleteHistoryEntry(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB delete error");
    });
  });

  // -------------------------------------------------------------
  // getRecommendation()
  // -------------------------------------------------------------
  describe("getRecommendation()", () => {
    test("Branch: Closet has 0 clean items -> 200 with message", async () => {
      pool.query = async () => ({ rows: [] });

      const req = { user: { id: 1 }, body: { temperature: 75, condition: "Sunny" } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.outfit, null);
      assert.strictEqual(res.body.message, "No clean items in your closet!");
    });

    test("Basis Path 1 (Cold: temp < 40): needs outerwear, warmth [7, 10], tag 'Cold'", async () => {
      const mockClothes = [
        { id: 1, name: "Heavy Coat", category: "coat", warmth_score: 9, photo_url: "coat.jpg" },
        { id: 2, name: "Heavy Sweater", category: "sweater", warmth_score: 8, photo_url: "sweater.jpg" },
        { id: 3, name: "Thick Jeans", category: "jeans", warmth_score: 7, photo_url: "jeans.jpg" },
        { id: 4, name: "Winter Boots", category: "shoes", warmth_score: 8, photo_url: "boots.jpg" },
        { id: 5, name: "Light Shorts", category: "shorts", warmth_score: 2, photo_url: null }, // filtered out by warmth
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 32, condition: "Snow" } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.outfit));
      assert.ok(res.body.tags.includes("Cold"));
      assert.ok(res.body.tags.includes("Snow"));

      const categories = res.body.outfit.map(item => item.category);
      assert.ok(categories.includes("sweater"));
      assert.ok(categories.includes("jeans"));
      assert.ok(categories.includes("coat"));
      assert.ok(categories.includes("shoes"));
      assert.ok(!categories.includes("shorts"), "Light shorts must be filtered out in cold weather");
    });

    test("Basis Path 2 (Cool: 40 <= temp < 55): warmth [5, 8], needsOuterwear=true, tag 'Cool'", async () => {
      const mockClothes = [
        { id: 1, name: "Windbreaker", category: "jacket", warmth_score: 6, photo_url: null },
        { id: 2, name: "Long Sleeve Shirt", category: "long-sleeve", warmth_score: 5, photo_url: null },
        { id: 3, name: "Pants", category: "pants", warmth_score: 6, photo_url: null },
        { id: 4, name: "Sneakers", category: "shoes", warmth_score: 5, photo_url: null },
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 50 } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tags.includes("Cool"));
      assert.strictEqual(res.body.tags.length, 1, "No condition passed, only temp tag present");
    });

    test("Basis Path 3 (Mild: 55 <= temp < 70): warmth [3, 6], needsOuterwear=false, tag 'Mild'", async () => {
      const mockClothes = [
        { id: 1, name: "Heavy Parka", category: "coat", warmth_score: 10, photo_url: null }, // should NOT be picked
        { id: 2, name: "Polo Shirt", category: "polo", warmth_score: 4, photo_url: null },
        { id: 3, name: "Casual Pants", category: "pants", warmth_score: 4, photo_url: null },
        { id: 4, name: "Loafers", category: "shoes", warmth_score: 4, photo_url: null },
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 65, condition: "Clear" } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tags.includes("Mild"));
      const categories = res.body.outfit.map(item => item.category);
      assert.ok(!categories.includes("coat"), "Outerwear should not be selected when temp >= 55");
    });

    test("Basis Path 4 (Warm: temp >= 70): warmth [1, 4], fullBody item prioritized", async () => {
      const mockClothes = [
        { id: 1, name: "Summer Dress", category: "dress", warmth_score: 2, photo_url: "dress.jpg" },
        { id: 2, name: "T-Shirt", category: "t-shirt", warmth_score: 2, photo_url: "tee.jpg" },
        { id: 3, name: "Shorts", category: "shorts", warmth_score: 1, photo_url: "shorts.jpg" },
        { id: 4, name: "Sandals", category: "shoes", warmth_score: 1, photo_url: "sandals.jpg" },
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 85, condition: "Partly Cloudy" } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.tags.includes("Warm"));
      assert.ok(res.body.tags.includes("Partly Cloudy"));

      const categories = res.body.outfit.map(item => item.category);
      assert.ok(categories.includes("dress"), "Dress should be picked as fullBody");
      assert.ok(!categories.includes("t-shirt"), "Top should be null when fullBody is present");
      assert.ok(!categories.includes("shorts"), "Bottom should be null when fullBody is present");
    });

    test("Branch: Items warmth_score is null -> accepted as wildcard", async () => {
      const mockClothes = [
        { id: 1, name: "Classic Tee", category: "t-shirt", warmth_score: null, photo_url: null },
        { id: 2, name: "Blue Jeans", category: "jeans", warmth_score: null, photo_url: null },
        { id: 3, name: "Sneakers", category: "shoes", warmth_score: null, photo_url: null },
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 72 } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.outfit.length, 3);
    });

    test("Branch: Not enough items to build an outfit -> 200 Not enough items", async () => {
      // User only has a hat or non-matching category
      const mockClothes = [
        { id: 1, name: "Random Underwear", category: "underwear", warmth_score: 1, photo_url: null },
      ];

      pool.query = async () => ({ rows: mockClothes });

      const req = { user: { id: 1 }, body: { temperature: 75 } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.outfit, null);
      assert.strictEqual(res.body.message, "Not enough items to build an outfit!");
    });

    test("Exception Path: DB error -> 500", async () => {
      pool.query = async () => { throw new Error("DB timeout"); };

      const req = { user: { id: 1 }, body: { temperature: 70 } };
      const res = createMockRes();

      await outfitController.getRecommendation(req, res);

      assert.strictEqual(res.statusCode, 500);
      assert.strictEqual(res.body.error, "DB timeout");
    });
  });
});
