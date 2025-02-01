// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  try {
    // 1. Check if the Authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No Authorization header provided",
      });
    }

    // 2. Confirm the header starts with "Bearer "
    //    and split out the token
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res
        .status(401)
        .json({ success: false, message: "Token malformed (missing 'Bearer')" });
    }

    // 3. Extract the token
    const token = parts[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Token not provided after 'Bearer'" });
    }

    // Optional: Log the token to debug what is being received
    console.log("Received token:", token);

    // 4. Verify the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach user info to the req object (for use in subsequent handlers)
    req.user = { id: decoded.id };

    // 6. Proceed to next middleware
    next();
  } catch (err) {
    console.error("JWT Error:", err);
    // Typically, jwt.verify throws an error if the token is invalid or expired
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authenticateToken;
