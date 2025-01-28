// app.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const linkRoutes = require("./routes/links");
const redirectRoutes = require("./routes/redirectRoutes"); // Import redirect routes
const errorMiddleware = require("./middlewares/errorMiddleware");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000", // Adjust to your frontend's URL
  credentials: true,
}));

// **Mount Redirect Route First**
app.use("/", redirectRoutes); // This should catch all root-level shortCodes

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// Error Middleware
app.use(errorMiddleware);

// Connect to MongoDB and start the server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
