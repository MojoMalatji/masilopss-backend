const express = require("express");

const router = express.Router();

const {
  createBooking,
  getBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
} = require("../controllers/bookingController");

/**
 * ========================================
 * CREATE BOOKING
 * ========================================
 */

router.post("/createBooking", createBooking);

/**
 * ========================================
 * GET BOOKINGS
 * ========================================
 */

router.get("/bookings", getBookings);

/**
 * ========================================
 * APPROVE BOOKING
 * ========================================
 */

router.post("/approveBooking", approveBooking);

/**
 * ========================================
 * REJECT BOOKING
 * ========================================
 */

router.post("/rejectBooking", rejectBooking);

router.post("/rejectBooking", rejectBooking);

/**
 * ========================================
 * CANCEL BOOKING
 * ========================================
 *
 * This goes through the backend so that:
 *
 * 1. Google Calendar event is deleted.
 * 2. Google Meet associated with the event
 *    is removed.
 * 3. Firestore booking is marked cancelled.
 * 4. calendarEventId is cleared.
 * 5. googleMeetLink is cleared.
 *
 */

router.post("/cancelBooking", cancelBooking);

module.exports = router;
