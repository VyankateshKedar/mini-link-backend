// models/Link.js
const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  deviceType: String,
  browser: String,
  os: String, // Added OS field
  clickedAt: {
    type: Date,
    default: Date.now,
  },
});

const linkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
    unique: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  destinationUrl: {
    type: String,
    required: true,
  },
  remarks: {
    type: String,
    default: "",
  },
  expiration: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  clicks: [clickSchema], // Click tracking
});

// **Add Indexes**
linkSchema.index({ shortCode: 1 });
linkSchema.index({ userId: 1 });
linkSchema.index({ "clicks.clickedAt": 1 });

module.exports = mongoose.model("Link", linkSchema);
