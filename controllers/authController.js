// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Basic validations
    if (!name || !email || !password) {
      const error = new Error("All fields are required");
      error.statusCode = 400;
      throw error;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User already exists with this email");
      error.statusCode = 400;
      throw error;
    }

    // Create new user
    const newUser = new User({ name, email, password });
    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    next(err);
  }
};

// Login a user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validations
    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      throw error;
    }

    // Check user in DB
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

// Get current user details
exports.getMe = async (req, res, next) => {
  try {
    // Fetch the user by ID from the JWT token
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Return user details
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Basic validation
    if (!name && !email) {
      const error = new Error("At least one field is required to update");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // If email is updated, signal logout
    let emailUpdated = false;
    if (email && email !== user.email) {
      user.email = email;
      emailUpdated = true;
    }
    if (name) user.name = name;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      emailUpdated
    });
  } catch (err) {
    next(err);
  }
};

// Delete user account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Delete user and associated links
    await user.remove();
    await Link.deleteMany({ userId });

    res.json({ success: true, message: "Account and associated links deleted" });
  } catch (err) {
    next(err);
  }
};
