// Express router for /clothing endpoints:
// - Create clothing items for the authenticated user
// - Fetch clothing items for the authenticated user (including primary photo URI)
// - Upload a photo file and link it to a clothing item (owned by the authenticated user)

const express = require("express");
const router = express.Router();
const pool = require("../database/db"); // Shared PostgreSQL connection pool
const authRequired = require("../middleware/authRequired"); // Middleware that requires a valid JWT Bearer token and sets req.user

// Multer handles multipart/form-data file uploads (images from phone)
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises; // For deleting photo files from disk

//--------------------------------------------------------------------------------//

// Configure how uploaded files are stored on disk
const storage = multer.diskStorage({
  // Save into server/uploads
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),

  // Generate a unique-ish filename to avoid collisions
  filename: (req, file, cb) => {
    // Clean up spaces for nicer filenames/URLs
    const safeName = file.originalname.replace(/\s+/g, "_");
    // Prefix with timestamp so two files with same name don't overwrite each other
    cb(null, `${Date.now()}-${safeName}`);
  }
});

// Multer middleware instance
const upload = multer({ storage });

// POST /clothing
// Creates a clothing item tied to the logged-in user (req.user.id)
router.post("/", authRequired, async (req, res) => {
  const {
    name,
    category,
    subcategory,
    layer_role,
    color_primary,
    color_secondary,
    pattern,
    material,
    formality_level,
    warmth_score,
    status,
    favorite
  } = req.body;

  // Minimal validation (expand later as needed)
  if (!name || !category) {
    return res.status(400).json({ error: "name and category required" });
  }

  try {
    // Insert the item; user_id comes from the verified JWT, not the client
    const result = await pool.query(
      `INSERT INTO clothing_items
       (user_id, name, category, subcategory, layer_role, color_primary, color_secondary, pattern, material, formality_level, warmth_score, status, favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        req.user.id,
        name,
        category,
        subcategory || null,
        layer_role || null,
        color_primary || null,
        color_secondary || null,
        pattern || null,
        material || null,
        formality_level ?? 0,
        warmth_score ?? 5,
        status || "clean",
        favorite ? 1 : 0
      ]
    );

    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /clothing
// Returns all clothing items for the logged-in user, plus the primary photo URI (if any)
router.get("/", authRequired, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.*,
        p.uri AS primary_photo_uri
      FROM clothing_items c
      LEFT JOIN item_photos p
        ON p.item_id = c.id AND p.is_primary = 1
      WHERE c.user_id = $1
      ORDER BY c.id DESC
      `,
      [req.user.id]
    );

    res.json({ items: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /clothing/analyze
// Sends a clothing photo to GPT-4o Vision and returns suggested tags
router.post("/analyze", authRequired, upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "photo file required" });
  }

  try {
    const fs_sync = require("fs");
    const imageData = fs_sync.readFileSync(req.file.path);
    const base64Image = imageData.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
              {
                type: "text",
                text: `Look at this clothing item and respond with ONLY a JSON object in this exact format, no other text:
{
  "category": "<one of: t-shirt, long-sleeve, button-up, polo, sweater, hoodie, jacket, coat, blazer, jeans, pants, shorts, skirt, dress, jumpsuit, suit, activewear, sleepwear, underwear, shoes>",
  "color_primary": "<one of: black, white, gray, blue, green, red, pink, purple, yellow, orange, brown, beige, teal>",
  "color_secondary": "<one of: black, white, gray, blue, green, red, pink, purple, yellow, orange, brown, beige, teal, none>",
  "pattern": "<one of: solid, striped, plaid, floral, graphic, camo, none>",
  "material": "<one of: cotton, polyester, denim, wool, leather, linen, silk, fleece, nylon, unknown>",
  "formality_level": <integer 0-4 where 0=casual, 1=smart casual, 2=business casual, 3=business, 4=formal>,
  "warmth_score": <integer 1-10 where 1=very light like a tank top, 10=very heavy like a winter coat>
}`
              },
            ],
          },
        ],
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No response from AI" });
    }

    const cleaned = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    
    res.json({
      category: parsed.category,
      color_primary: parsed.color_primary,
      color_secondary: parsed.color_secondary !== "none" ? parsed.color_secondary : null,
      pattern: parsed.pattern !== "none" ? parsed.pattern : null,
      material: parsed.material !== "unknown" ? parsed.material : null,
      formality_level: parsed.formality_level,
      warmth_score: parsed.warmth_score,
    });

  } catch (err) {
    console.error("Analyze error:", err.message);
    res.status(500).json({ error: "Could not analyze image" });
  }
});

// POST /clothing/:id/photos
// Uploads a real image file and attaches it to a clothing item (must belong to user)
// Expects multipart/form-data with field name "photo"
router.post("/:id/photos", authRequired, upload.single("photo"), async (req, res) => {
  const itemId = req.params.id;

  // Must include a file in multipart/form-data with field name "photo"
  if (!req.file) {
    return res.status(400).json({ error: "photo file required (field name: photo)" });
  }

  // If client sends is_primary as "1" or "true", treat as primary
  const isPrimary = req.body.is_primary === "1" || req.body.is_primary === "true";

  // Store relative path in DB (served later via /uploads static)
  const uri = `uploads/${req.file.filename}`;

  try {
    // Confirm clothing item belongs to the logged-in user
    const itemResult = await pool.query(
      "SELECT id FROM clothing_items WHERE id = $1 AND user_id = $2",
      [itemId, req.user.id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // If this photo is primary, clear any existing primaries for this item
    if (isPrimary) {
      await pool.query(
        "UPDATE item_photos SET is_primary = 0 WHERE item_id = $1",
        [itemId]
      );
    }

    // Insert the new photo record
    const photoResult = await pool.query(
      "INSERT INTO item_photos (item_id, uri, is_primary) VALUES ($1, $2, $3) RETURNING id",
      [itemId, uri, isPrimary ? 1 : 0]
    );

    res.status(201).json({ id: photoResult.rows[0].id, uri });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/delete", authRequired, async (req, res) => {
  const itemId = req.params.id;

  try {
    // Confirm clothing item belongs to the logged-in user
    const itemResult = await pool.query(
      "SELECT id FROM clothing_items WHERE id = $1 AND user_id = $2",
      [itemId, req.user.id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Fetch photo URIs before deleting from database
    const photosResult = await pool.query(
      "SELECT uri FROM item_photos WHERE item_id = $1",
      [itemId]
    );

    // Delete photo files from server disk
    for (const photo of photosResult.rows) {
      const filePath = path.join(__dirname, "..", photo.uri);
      try {
        await fs.unlink(filePath);
      } catch (fileErr) {
        // Log but don't fail if file doesn't exist
        console.warn(`Could not delete file: ${filePath}`, fileErr.message);
      }
    }

    // Delete all photos associated with this clothing item from database
    await pool.query(
      "DELETE FROM item_photos WHERE item_id = $1",
      [itemId]
    );


    // Delete the clothing item
    await pool.query(
      "DELETE FROM clothing_items WHERE id = $1",
      [itemId]
    );

    res.json({ success: true, message: "Item deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id/edit", authRequired, upload.single("photo"), async (req, res) => {
  const itemId = req.params.id;
  try {
    const itemResult = await pool.query(
      "SELECT id FROM clothing_items WHERE id = $1 AND user_id = $2",
      [itemId, req.user.id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Get current values first (for fields not being updated)
    const currentItem = await pool.query(
      "SELECT * FROM clothing_items WHERE id = $1",
      [itemId]
    );
    const current = currentItem.rows[0];

    // Use provided values or keep existing
    const updates = await pool.query(
      `UPDATE clothing_items SET
        name = $1,
        category = $2,
        subcategory = $3,
        layer_role = $4,
        color_primary = $5,
        color_secondary = $6,
        pattern = $7,
        material = $8,
        formality_level = $9,
        warmth_score = $10,
        status = $11,
        favorite = $12
        WHERE id = $13`,
      [
        req.body.name ?? current.name,
        req.body.category ?? current.category,
        req.body.subcategory ?? current.subcategory,
        req.body.layer_role ?? current.layer_role,
        req.body.color_primary ?? current.color_primary,
        req.body.color_secondary ?? current.color_secondary,
        req.body.pattern ?? current.pattern,
        req.body.material ?? current.material,
        req.body.formality_level ?? current.formality_level,
        req.body.warmth_score ?? current.warmth_score,
        req.body.status ?? current.status,
        req.body.favorite ? 1 : (req.body.favorite === false ? 0 : current.favorite),
        itemId
      ]
    );

        // Handle photo replacement if uploaded
    if (req.file) {
      const uri = `uploads/${req.file.filename}`;
      const oldPhotoResult = await pool.query(
        "SELECT uri FROM item_photos WHERE item_id = $1 AND is_primary = 1",
        [itemId]
      );

      if (oldPhotoResult.rows.length > 0) {
        const oldUri = oldPhotoResult.rows[0].uri;
        const oldFilePath = path.join(__dirname, "..", oldUri);
        try {
          await fs.unlink(oldFilePath);
        } catch (fileErr) {
          console.warn(`Could not delete old file: ${oldFilePath}`, fileErr.message);
        }
        await pool.query("DELETE FROM item_photos WHERE item_id = $1 AND is_primary = 1", [itemId]);
      }

      await pool.query(
        "INSERT INTO item_photos (item_id, uri, is_primary) VALUES ($1, $2, $3)",
        [itemId, uri, 1]
      );
    }

    res.json({ success: true, message: "Item updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

});

// PATCH /clothing/:id/status
// Toggles a clothing item's status between clean and dirty
router.patch("/:id/status", authRequired, async (req, res) => {
  const itemId = req.params.id;

  try {
    // Confirm clothing item belongs to the logged-in user
    const itemResult = await pool.query(
      "SELECT id, status FROM clothing_items WHERE id = $1 AND user_id = $2",
      [itemId, req.user.id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // Toggle the status
    const currentStatus = itemResult.rows[0].status;
    const newStatus = currentStatus === "clean" ? "dirty" : "clean";

    await pool.query(
      "UPDATE clothing_items SET status = $1 WHERE id = $2",
      [newStatus, itemId]
    );

    res.json({ success: true, status: newStatus });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;