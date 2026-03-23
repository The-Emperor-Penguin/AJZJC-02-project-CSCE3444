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

module.exports = router;