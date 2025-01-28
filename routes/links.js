// routes/links.js
const express = require("express");
const router = express.Router();
const linkController = require("../controllers/linkController");
const authenticateToken = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// **New Route for Dashboard Statistics**
router.get("/dashboard/stats", linkController.getDashboardStats);

// **New Analytics Route**
router.get("/analytics", linkController.getAllClicks);

// POST route to create a new link
router.post("/", linkController.createLink);

// GET route to fetch links with pagination and search
router.get("/", linkController.getLinks);

// Route to get link analytics
router.get("/analytics/:id", linkController.getLinkAnalytics);

// GET route to fetch link details
router.get("/:id", linkController.getLinkDetails);

// PUT route to edit a link
router.put("/:id", linkController.editLink);

// DELETE route to delete a link
router.delete("/:id", linkController.deleteLink);

module.exports = router;
