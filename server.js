require("dotenv").config();

const express = require("express");
const cors = require("cors");

const corsOptions = require("./config/cors");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const bookingRoutes = require("./routes/bookingRoutes");
const blockerRoutes = require("./routes/blockerRoutes");
const emailRoutes = require("./routes/emailRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const adminAppointmentRoutes = require("./routes/adminAppointmentRoutes");

const app = express();

// ========================================
// CORS
// ========================================

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ========================================
// BODY PARSER
// ========================================

app.use(express.json());

// ========================================
// LOGGER
// ========================================

app.use(logger);

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Mashilo PSS Backend is running 🚀",
    environment:
      process.env.NODE_ENV || "development",
  });
});

// ========================================
// ROUTES
// ========================================

// Public website bookings
app.use("/", bookingRoutes);

// Counselor blockers
app.use("/", blockerRoutes);

// Admin appointment creation
app.use("/", adminAppointmentRoutes);

// Email routes
app.use("/api/email", emailRoutes);

// Google authentication
app.use("/", googleAuthRoutes);

// ========================================
// ERROR HANDLER
// ========================================

app.use(errorHandler);

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Mashilo PSS Backend running on port ${PORT}`
  );
});