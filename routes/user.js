const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware"); // Assuming you have an auth middleware

// Get user details
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
