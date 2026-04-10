const express = require("express");
const router = express.Router();
const outfitController = require("../controllers/outfitHistoryController");
const authRequired = require("../middleware/authRequired");

// All routes require authentication
router.get("/history", authRequired, outfitController.getHistory);
router.post("/history", authRequired, outfitController.logOutfit);
router.delete("/history/:id", authRequired, outfitController.deleteHistoryEntry);
router.post("/recommend", authRequired, outfitController.getRecommendation);

module.exports = router;