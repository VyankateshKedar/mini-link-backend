// routes/links.js
const express = require("express");
const router = express.Router();
const linkController = require("../controllers/linkController");
const authenticateToken = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// =========== Dashboard & Analytics ===========
router.get("/dashboard/stats", linkController.getDashboardStats);
router.get("/all-clicks", linkController.getAllClicks);        // e.g., for entire dataset
router.get("/analytics/:id", linkController.getLinkAnalytics); // e.g., analytics for one link

// =========== CRUD Operations on Links ===========
router.post("/", linkController.createLink);
router.get("/", linkController.getLinks);
router.get("/:id", linkController.getLinkDetails);
router.put("/:id", linkController.editLink);
router.delete("/:id", linkController.deleteLink);


module.exports = router;
