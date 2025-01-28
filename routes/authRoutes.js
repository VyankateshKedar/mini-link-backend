// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");

// Route to register a user
router.post("/register", authController.register);

// Route to login a user
router.post("/login", authController.login);

// Route to get current user details
router.get("/me", authenticateToken, authController.getMe);

// Route to update user profile
router.put("/update-profile", authenticateToken, authController.updateProfile);

// Route to delete user account
router.delete("/delete-account", authenticateToken, authController.deleteAccount);

module.exports = router;
