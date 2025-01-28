const mongoose = require("mongoose");
const Analytics = require("./models/Analytics"); // Path to your Analytics model

const seedAnalytics = async () => {
  await mongoose.connect("http://localhost:5000/api/dashboard/analytics", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const analyticsData = [
    {
      userId: "67927d7f0f0eb6137e358430", // Replace with a valid user ID
      totalClicks: 1234,
      dateWiseClicks: [
        { date: "2025-01-21", clicks: 1234 },
        { date: "2025-01-20", clicks: 1140 },
        { date: "2025-01-19", clicks: 134 },
        { date: "2025-01-18", clicks: 34 },
      ],
      clickDevices: {
        Mobile: 134,
        Desktop: 40,
        Tablet: 3,
      },
    },
  ];

  await Analytics.insertMany(analyticsData);
  console.log("Dummy analytics added!");
  mongoose.connection.close();
};

seedAnalytics();
