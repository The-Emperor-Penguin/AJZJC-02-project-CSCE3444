// AI Assisted (Claude by Anthropic)
const pool = require("../database/db");

// GET /outfits/history
// Returns all outfit history entries for the logged-in user,
// including the clothing items and their primary photo for each entry
exports.getHistory = async (req, res) => {
  try {
    // Fetch all outfit log entries belonging to this user, newest first
    const logsResult = await pool.query(
      `SELECT * FROM outfit_logs WHERE user_id = $1 ORDER BY date_worn DESC`,
      [req.user.id]
    );

    const logs = logsResult.rows;

    // If the user has no history yet, return an empty array (not an error)
    if (logs.length === 0) {
      return res.json({ history: [] });
    }

    // Collect all outfit log IDs so we can fetch their items in one query
    const logIds = logs.map((log) => log.id);

    // Fetch all clothing items linked to these outfit logs, including their primary photo
    // ANY($1) lets us pass the whole array of IDs at once (PostgreSQL feature)
    const itemsResult = await pool.query(
      `
      SELECT
        oli.outfit_log_id,
        ci.id,
        ci.name,
        ci.category,
        ci.color_primary,
        p.uri AS photo_url
      FROM outfit_log_items oli
      JOIN clothing_items ci ON ci.id = oli.clothing_item_id
      LEFT JOIN item_photos p ON p.item_id = ci.id AND p.is_primary = 1
      WHERE oli.outfit_log_id = ANY($1)
      `,
      [logIds]
    );

    // Group items by their outfit_log_id so we can attach them to each log entry
    const itemsByLog = {};
    for (const item of itemsResult.rows) {
      if (!itemsByLog[item.outfit_log_id]) {
        itemsByLog[item.outfit_log_id] = [];
      }
      // Build the photo URL the frontend expects (full URL, not just relative path)
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      itemsByLog[item.outfit_log_id].push({
        id: item.id,
        name: item.name,
        category: item.category,
        color_primary: item.color_primary,
        photo_url: item.photo_url ? `${baseUrl}/${item.photo_url}` : null,
      });
    }

    // Attach the items array to each log entry before returning
    const history = logs.map((log) => ({
      id: log.id,
      date_worn: log.date_worn,
      weather_temperature: log.weather_temperature,
      weather_condition: log.weather_condition,
      weather_city: log.weather_city,
      photo_url: null, // reserved for future composite outfit photo support
      items: itemsByLog[log.id] || [],
    }));

    res.json({ history });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /outfits/history
// Logs a new outfit entry (either from a recommendation or "Wear Again")
// Body: { item_ids: number[], date_worn?: string }
exports.logOutfit = async (req, res) => {
  const { item_ids, date_worn } = req.body;

  // Validate that item_ids is a non-empty array
  if (!Array.isArray(item_ids) || item_ids.length === 0) {
    return res.status(400).json({ error: "item_ids must be a non-empty array" });
  }

  // Use the provided date or fall back to right now
  const wornAt = date_worn || new Date().toISOString();

  try {
    // Verify that every item_id actually belongs to this user
    // This prevents users from logging other people's clothes
    const ownerCheck = await pool.query(
      `SELECT id FROM clothing_items WHERE id = ANY($1) AND user_id = $2`,
      [item_ids, req.user.id]
    );

    if (ownerCheck.rows.length !== item_ids.length) {
      return res.status(403).json({ error: "One or more items do not belong to you" });
    }

    // Create the outfit log entry
    const logResult = await pool.query(
      `INSERT INTO outfit_logs (user_id, date_worn) VALUES ($1, $2) RETURNING id`,
      [req.user.id, wornAt]
    );

    const logId = logResult.rows[0].id;

    // Link each clothing item to this outfit log entry
    // Build a multi-row insert: ($1,$2), ($1,$3), ($1,$4) ...
    const valuePlaceholders = item_ids
      .map((_, i) => `($1, $${i + 2})`)
      .join(", ");

    await pool.query(
      `INSERT INTO outfit_log_items (outfit_log_id, clothing_item_id) VALUES ${valuePlaceholders}`,
      [logId, ...item_ids]
    );

    res.status(201).json({ id: logId, date_worn: wornAt });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// DELETE /outfits/history/:id
// Removes a single outfit log entry (must belong to the logged-in user)
exports.deleteHistoryEntry = async (req, res) => {
  const entryId = req.params.id;

  try {
    // Confirm the entry belongs to this user before deleting
    const result = await pool.query(
      `DELETE FROM outfit_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [entryId, req.user.id]
    );

    // If nothing was deleted, the entry either doesn't exist or belongs to someone else
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted successfully" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};