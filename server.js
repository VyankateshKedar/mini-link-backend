// server.js

const express = require("express");
const cors = require("cors"); // Import the cors middleware
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirectRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

// Load environment variables from .env file
dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Middleware to parse JSON requests
app.use(express.json());

// CORS Configuration
const allowedOrigins = ['https://mini-link-frontend.vercel.app']; // List of allowed origins

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

// Use CORS middleware with the defined options
app.use(cors(corsOptions));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// Redirection Route (should be after API routes)
app.use("/", redirectRoutes);

// Error Handling Middleware (should be the last middleware)
app.use(errorMiddleware);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
