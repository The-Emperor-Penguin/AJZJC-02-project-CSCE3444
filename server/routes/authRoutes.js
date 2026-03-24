const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authRequired = require("../middleware/authRequired");

//Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);

//Profile routes (require authentication)
router.get("/profile", authRequired, authController.getProfile);
router.put("/profile", authRequired, authController.updateProfile);
router.put("/change-password", authRequired, authController.changePassword);

module.exports = router;