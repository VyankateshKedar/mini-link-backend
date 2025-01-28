// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  try {
    // 1. Check for token in headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // 2. Parse out "Bearer" part
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token malformed" });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded might look like: { id: "<someObjectId>", iat: 1234, exp: 1234 }

    // 4. Attach user info to req
    req.user = { id: decoded.id };
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
