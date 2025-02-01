// server.js

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirectRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware to parse JSON requests
app.use(express.json());

// CORS Configuration
const allowedOrigins = ["https://mini-link-frontend-mn8z.vercel.app"]; // Add any other allowed origins as needed

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // Allow cookies and other credentials
};

app.use(cors(corsOptions));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// Redirection Routes (must be placed after API routes so they don't override them)
app.use("/", redirectRoutes);

// Error Handling Middleware (must be the last middleware)
app.use(errorMiddleware);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
