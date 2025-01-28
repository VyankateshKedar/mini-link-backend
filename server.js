// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirectRoutes"); // Import redirect routes
const errorMiddleware = require("./middlewares/errorMiddleware");

dotenv.config(); // Load environment variables from .env file

const app = express();

// =========================
// Middleware Configuration
// =========================

// Parse incoming JSON requests
app.use(express.json());

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL, // e.g., https://mini-link-frontend.vercel.app
  // Add other origins if necessary
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies and other credentials
}));

// =========================
// Route Configuration
// =========================

// **Mount Redirect Route First**
// This should catch all root-level shortCodes (e.g., http://yourdomain.com/abc123)
app.use("/", redirectRoutes);

// **Mount API Routes**
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// =========================
// Error Handling Middleware
// =========================
app.use(errorMiddleware);

// =========================
// Database Connection & Server Start
// =========================
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  });
