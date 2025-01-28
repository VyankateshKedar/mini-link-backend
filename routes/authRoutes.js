const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middlewares/authMiddleware");
const User = require("../models/User"); 
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Route to register a user
router.post("/register", authController.register);

// Route to login a user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists in DB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // 2. Compare password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // 3. Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    // 4. Return token + user details (omitting the password)
    res.json({
      success: true,
      token,
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email 
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error occurred." });
  }
});

// Route to get the current user details
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // Fetch the user by ID from the JWT token
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return user details
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
