const bookingService = require("../services/bookingService");

const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.createBooking(req.body);

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking,
    });
  } catch (error) {
    console.error("Create Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create booking.",
      error: error.message,
    });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getBookings();

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Get Bookings Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
      error: error.message,
    });
  }
};

module.exports = {
  createBooking,
  getBookings,
};