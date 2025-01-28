// controllers/linkController.js
const { nanoid } = require("nanoid"); // Using nanoid for better uniqueness
const Link = require("../models/Link");
const parseUserAgent = require("../utils/parseUserAgent");


exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all links for the user and populate clicks
    const links = await Link.find({ userId }).select("clicks");

    // Aggregate all clicks across all links
    const allClicks = links.reduce((acc, link) => {
      if (link.clicks && link.clicks.length > 0) {
        acc.push(...link.clicks);
      }
      return acc;
    }, []);

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
      if (dateWiseClicks[date]) {
        dateWiseClicks[date]++;
      } else {
        dateWiseClicks[date] = 1;
      }
    });

    // Convert dateWiseClicks to an array and sort by date descending
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
      if (click.deviceType === "mobile") deviceWiseClicks.Mobile++;
      else if (click.deviceType === "desktop") deviceWiseClicks.Desktop++;
      else if (click.deviceType === "tablet") deviceWiseClicks.Tablet++;
      else deviceWiseClicks.Other++;
    });

    res.json({
      success: true,
      data: {
        totalClicks,
        dateWiseClicks: sortedDateWiseClicks,
        deviceWiseClicks,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.createLink = async (req, res, next) => {
  try {
    const { destinationUrl, expiration } = req.body;

    if (!destinationUrl) {
      const error = new Error("Destination URL is required");
      error.statusCode = 400;
      throw error;
    }

    // Validate destinationUrl
    const validator = require("validator");
    if (!validator.isURL(destinationUrl, { require_protocol: true })) {
      const error = new Error("Invalid Destination URL");
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


exports.editLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { destinationUrl, shortCode, expiration } = req.body; // Changed from shortUrl to shortCode

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

    if (destinationUrl) link.destinationUrl = destinationUrl;
    if (shortCode && shortCode !== link.shortCode) {
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
    link.expiration = expiration || null;

    await link.save();

    res.json({ success: true, message: "Link updated successfully", link });
  } catch (err) {
    next(err);
  }
};

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

    await link.remove();
    res.json({ success: true, message: "Link deleted successfully" });
  } catch (err) {
    next(err);
  }
};

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
    const { deviceType, browser } = parseUserAgent(req.headers["user-agent"] || "");

    // Record click data
    link.clicks.push({
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceType,
      browser,
    });
    await link.save();

    // Redirect to destination URL
    return res.redirect(link.destinationUrl);
  } catch (err) {
    next(err);
  }
};

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

    link.clicks.forEach((click) => {
      deviceSummary[click.deviceType] = (deviceSummary[click.deviceType] || 0) + 1;
      browserSummary[click.browser] = (browserSummary[click.browser] || 0) + 1;
    });

    res.json({
      success: true,
      totalClicks,
      deviceSummary,
      browserSummary,
      clicks: link.clicks,
    });
  } catch (err) {
    next(err);
  }
};

// controllers/linkController.js

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
