const express = require("express");

const router = express.Router();

const {
  createBooking,
  getBookings,
} = require("../controllers/bookingController");

router.post("/createBooking", createBooking);

router.get("/bookings", getBookings);

module.exports = router;