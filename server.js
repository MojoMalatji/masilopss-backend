require("dotenv").config();

const express = require("express");
const cors = require("cors");

const corsOptions = require("./config/cors");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const bookingRoutes = require("./routes/bookingRoutes");

const emailRoutes = require("./routes/emailRoutes");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(logger);

app.get("/", (req, res) => {
  res.send("Mashilo PSS Backend is running 🚀");
});

app.use("/", bookingRoutes);

app.use("/api/email", emailRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});