// controllers/linkController.js
const { nanoid } = require("nanoid");
const Link = require("../models/Link");
const parseUserAgent = require("../utils/parseUserAgent");
const validator = require("validator");

// Create a new link
exports.createLink = async (req, res, next) => {
  try {
    const { destinationUrl, expiration, remarks } = req.body;

    if (!destinationUrl) {
      const error = new Error("Destination URL is required");
      error.statusCode = 400;
      throw error;
    }

    // Validate destinationUrl
    if (!validator.isURL(destinationUrl, { require_protocol: true })) {
      const error = new Error("Invalid Destination URL");
      error.statusCode = 400;
      throw error;
    }

    // Validate expiration date if provided
    if (expiration && new Date(expiration) <= new Date()) {
      const error = new Error("Expiration date must be in the future");
      error.statusCode = 400;
      throw error;
    }

    // Generate a unique shortCode using nanoid
    let shortCode;
    let shortUrl;
    let exists = true;

    while (exists) {
      shortCode = nanoid(8); // Generates an 8-character unique ID
      shortUrl = `${process.env.BASE_URL}/${shortCode}`;

      const existingLink = await Link.findOne({ shortCode });
      if (!existingLink) {
        exists = false;
      }
    }

    const newLink = new Link({
      destinationUrl,
      shortUrl,
      shortCode,
      expiration: expiration || null,
      remarks: remarks || "",
      userId: req.user.id,
    });

    await newLink.save();

    res.status(201).json({ 
      success: true, 
      message: "Link created successfully", 
      link: newLink 
    });
  } catch (err) {
    next(err);
  }
};

// Edit an existing link
exports.editLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { destinationUrl, shortCode, expiration, remarks } = req.body;

    const link = await Link.findById(id);
    if (!link) {
      const error = new Error("Link not found");
      error.statusCode = 404;
      throw error;
    }

    // Check ownership
    if (link.userId.toString() !== req.user.id) {
      const error = new Error("Unauthorized access to this link");
      error.statusCode = 403;
      throw error;
    }

    if (destinationUrl) {
      if (!validator.isURL(destinationUrl, { require_protocol: true })) {
        const error = new Error("Invalid Destination URL");
        error.statusCode = 400;
        throw error;
      }
      link.destinationUrl = destinationUrl;
    }

    if (shortCode && shortCode !== link.shortCode) {
      // Validate shortCode length and characters if necessary
      if (!validator.isAlphanumeric(shortCode) || shortCode.length < 6 || shortCode.length > 8) {
        const error = new Error("shortCode must be 6-8 alphanumeric characters");
        error.statusCode = 400;
        throw error;
      }

      // Check for uniqueness
      const existingLink = await Link.findOne({ shortCode });
      if (existingLink) {
        const error = new Error("shortCode already in use");
        error.statusCode = 400;
        throw error;
      }
      link.shortCode = shortCode;
      link.shortUrl = `${process.env.BASE_URL}/${shortCode}`;
    }

    if (expiration) {
      if (new Date(expiration) <= new Date()) {
        const error = new Error("Expiration date must be in the future");
        error.statusCode = 400;
        throw error;
      }
      link.expiration = expiration;
    } else {
      link.expiration = null;
    }

    if (remarks !== undefined) {
      link.remarks = remarks;
    }

    await link.save();

    res.json({ success: true, message: "Link updated successfully", link });
  } catch (err) {
    next(err);
  }
};
