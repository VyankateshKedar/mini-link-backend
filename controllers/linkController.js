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

// Get all links with pagination and search
exports.getLinks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const query = {
      userId: req.user.id,
      $or: [
        { destinationUrl: { $regex: search, $options: "i" } },
        { shortUrl: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ],
    };

    const totalLinks = await Link.countDocuments(query);
    const links = await Link.find(query)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalLinks,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalLinks / limitNumber),
      links,
    });
  } catch (err) {
    next(err);
  }
};

// Get link details by ID
exports.getLinkDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    res.json({ success: true, link });
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

// Delete a link by ID
exports.deleteLink = async (req, res, next) => {
  try {
    const { id } = req.params;
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

    // Use the newer deleteOne() method on the retrieved document
    await link.deleteOne();

    res.json({ success: true, message: "Link deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// Track a click and redirect
exports.trackClick = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const link = await Link.findOne({ shortCode });
    if (!link) {
      const error = new Error("Link not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if link is expired
    if (link.expiration && link.expiration < new Date()) {
      return res.status(410).json({ success: false, message: "Link expired" });
    }

    // Parse user agent
    const { deviceType, browser, os } = parseUserAgent(req.headers["user-agent"] || "");

    // Record click data
    link.clicks.push({
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceType,
      browser,
      os, // Store OS information
    });
    await link.save();

    // Redirect to destination URL
    return res.redirect(link.destinationUrl);
  } catch (err) {
    next(err);
  }
};

// Get analytics for a specific link
exports.getLinkAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const link = await Link.findById(id);
    if (!link) {
      const error = new Error("Link not found");
      error.statusCode = 404;
      throw error;
    }

    if (link.userId.toString() !== req.user.id) {
      const error = new Error("Unauthorized access to this link");
      error.statusCode = 403;
      throw error;
    }

    // Aggregated analytics
    const totalClicks = link.clicks.length;

    // Summaries
    const deviceSummary = {};
    const browserSummary = {};
    const osSummary = {};

    link.clicks.forEach((click) => {
      deviceSummary[click.deviceType] = (deviceSummary[click.deviceType] || 0) + 1;
      browserSummary[click.browser] = (browserSummary[click.browser] || 0) + 1;
      osSummary[click.os] = (osSummary[click.os] || 0) + 1;
    });

    res.json({
      success: true,
      totalClicks,
      deviceSummary,
      browserSummary,
      osSummary, // Include OS summary
      clicks: link.clicks,
    });
  } catch (err) {
    next(err);
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all links for the user, selecting only what you need to display:
    //    e.g. _id, shortUrl, remarks, etc.
    const userLinks = await Link.find({ userId })
  .select("_id shortUrl clicks");

    // 2. Aggregate all clicks across these links
    const allClicks = [];
    for (const link of userLinks) {
      if (link.clicks && link.clicks.length > 0) {
        allClicks.push(...link.clicks);
      }
    }

    // Total Clicks
    const totalClicks = allClicks.length;

    // Date-wise Clicks
    const dateWiseClicks = {};
    allClicks.forEach((click) => {
      const date = new Date(click.clickedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      dateWiseClicks[date] = (dateWiseClicks[date] || 0) + 1;
    });

    // Sort date-wise clicks in descending order of date
    const sortedDateWiseClicks = Object.keys(dateWiseClicks)
      .map((date) => ({ date, count: dateWiseClicks[date] }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Device-wise Clicks
    const deviceWiseClicks = {
      Mobile: 0,
      Desktop: 0,
      Tablet: 0,
      Other: 0,
    };
    allClicks.forEach((click) => {
      if (click.deviceType === "Mobile") deviceWiseClicks.Mobile++;
      else if (click.deviceType === "Desktop") deviceWiseClicks.Desktop++;
      else if (click.deviceType === "Tablet") deviceWiseClicks.Tablet++;
      else deviceWiseClicks.Other++;
    });

    // 3. Return everything, including the userLinks array
    return res.json({
      success: true,
      data: {
        totalClicks,
        dateWiseClicks: sortedDateWiseClicks,
        deviceWiseClicks,
        links: userLinks, // <-- Now your frontend can map over `dashboardStats.links`
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get all clicks across user links with pagination
exports.getAllClicks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Fetch all links for the user
    const links = await Link.find({ userId }).select("shortUrl destinationUrl clicks");

    // Aggregate click data
    let allClicks = links.flatMap(link => {
      return link.clicks.map(click => ({
        clickedAt: click.clickedAt,
        destinationUrl: link.destinationUrl,
        shortUrl: link.shortUrl,
        ip: click.ip,
        deviceType: click.deviceType,
        browser: click.browser,
        os: click.os, // Include OS if implemented
      }));
    });

    // Sort clicks by timestamp descending
    allClicks.sort((a, b) => new Date(b.clickedAt) - new Date(a.clickedAt));

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedClicks = allClicks.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedClicks,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(allClicks.length / limit),
      totalClicks: allClicks.length,
    });
  } catch (err) {
    next(err);
  }
};
