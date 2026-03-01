// Express router for /clothing endpoints:
// - Create clothing items for the authenticated user
// - Fetch clothing items for the authenticated user (including primary photo URI)
// - Upload a photo file and link it to a clothing item (owned by the authenticated user)

const express = require("express");
const router = express.Router();
const db = require("../database/db"); // Shared DB connection (SQLite)
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
router.post("/", authRequired, (req, res) => {
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

  // Insert the item; user_id comes from the verified JWT, not the client
  db.run(
    `INSERT INTO clothing_items
     (user_id, name, category, subcategory, layer_role, color_primary, color_secondary, pattern, material, formality_level, warmth_score, status, favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // lastID is the inserted clothing item ID
      res.status(201).json({ id: this.lastID });
    }
  );
});

// GET /clothing
// Returns all clothing items for the logged-in user, plus the primary photo URI (if any)
router.get("/", authRequired, (req, res) => {
  db.all(
    `
    SELECT
      c.*,
      p.uri AS primary_photo_uri
    FROM clothing_items c
    LEFT JOIN item_photos p
      ON p.item_id = c.id AND p.is_primary = 1
    WHERE c.user_id = ?
    ORDER BY c.id DESC
    `,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ items: rows });
    }
  );
});

// POST /clothing/:id/photos
// Uploads a real image file and attaches it to a clothing item (must belong to user)
// Expects multipart/form-data with field name "photo"
router.post("/:id/photos", authRequired, upload.single("photo"), (req, res) => {
  const itemId = req.params.id;

  // Must include a file in multipart/form-data with field name "photo"
  if (!req.file) {
    return res.status(400).json({ error: "photo file required (field name: photo)" });
  }

  // If client sends is_primary as "1" or "true", treat as primary
  const isPrimary = req.body.is_primary === "1" || req.body.is_primary === "true";

  // Store relative path in DB (served later via /uploads static)
  const uri = `uploads/${req.file.filename}`;

  // Confirm clothing item belongs to the logged-in user
  db.get(
    "SELECT id FROM clothing_items WHERE id = ? AND user_id = ?",
    [itemId, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Item not found" });

      // If this photo is primary, clear any existing primaries for this item
      const clearPrimariesIfNeeded = (cb) => {
        if (!isPrimary) return cb(null);
        db.run(
          "UPDATE item_photos SET is_primary = 0 WHERE item_id = ?",
          [itemId],
          cb
        );
      };

      clearPrimariesIfNeeded((clearErr) => {
        if (clearErr) return res.status(500).json({ error: clearErr.message });

        // Insert the new photo record
        db.run(
          "INSERT INTO item_photos (item_id, uri, is_primary) VALUES (?, ?, ?)",
          [itemId, uri, isPrimary ? 1 : 0],
          function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            res.status(201).json({ id: this.lastID, uri });
          }
        );
      });
    }
  );
});

module.exports = router;