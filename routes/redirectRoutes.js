// routes/redirect.js
const express = require("express");
const router = express.Router();
const linkController = require("../controllers/linkController");

// Route to handle redirection
router.get("/:shortCode", linkController.trackClick);

module.exports = router;
