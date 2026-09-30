const bookingService = require("../services/bookingService");

/**
 * Create booking
 */
const createBooking = async (req, res) => {
  try {
    const booking =
      await bookingService.createBooking(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Booking created successfully.",
      booking,
    });
  } catch (error) {
    console.error(
      "Create Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to create booking.",
      error: error.message,
    });
  }
};

/**
 * Get bookings
 */
const getBookings = async (req, res) => {
  try {
    const bookings =
      await bookingService.getBookings();

    res.status(200).json(bookings);
  } catch (error) {
    console.error(
      "Get Bookings Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch bookings.",
      error: error.message,
    });
  }
};

/**
 * Approve booking
 */
const approveBooking = async (
  req,
  res
) => {
  try {
    const {
      bookingId,
      counselorId,
      counselorName,
      counselorEmail,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required.",
      });
    }

    if (
      !counselorId ||
      !counselorName ||
      !counselorEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Counselor details are required.",
      });
    }

    const result =
      await bookingService.approveBooking({
        bookingId,
        counselorId,
        counselorName,
        counselorEmail,
      });

    res.status(200).json({
      success: true,
      message:
        "Booking approved successfully.",
      booking: result.booking,
      calendar: result.calendar,
      notifications:
        result.notifications,
    });
  } catch (error) {
    console.error(
      "Approve Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to approve booking.",
      error: error.message,
    });
  }
};

/**
 * Reject booking
 */
const rejectBooking = async (
  req,
  res
) => {
  try {
    const {
      bookingId,
      counselorId,
      counselorName,
      counselorEmail,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required.",
      });
    }

    const result =
      await bookingService.rejectBooking({
        bookingId,
        counselorId,
        counselorName,
        counselorEmail,
      });

    res.status(200).json({
      success: true,
      message:
        "Booking rejected successfully.",
      booking: result.booking,
      notifications:
        result.notifications,
    });
  } catch (error) {
    console.error(
      "Reject Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to reject booking.",
      error: error.message,
    });
  }
};

/**
 * Cancel booking
 *
 * This will:
 * 1. Remove the Google Calendar event.
 * 2. Remove the Google Meet associated with it.
 * 3. Mark the Firestore booking as cancelled.
 * 4. Clear calendarEventId and googleMeetLink.
 */
const cancelBooking = async (
  req,
  res
) => {
  try {
    const {
      bookingId,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message:
          "Booking ID is required.",
      });
    }

    const result =
      await bookingService.cancelBooking(
        bookingId
      );

    res.status(200).json({
      success: true,
      message:
        "Booking cancelled successfully.",
      booking: result.booking,
      calendar: result.calendar,
      notifications:
        result.notifications,
    });
  } catch (error) {
    console.error(
      "Cancel Booking Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to cancel booking.",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
};