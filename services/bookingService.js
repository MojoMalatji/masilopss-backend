const firestoreService = require("./firestoreService");
const notificationService = require("./notificationService");

const createBooking = async (booking) => {

  const id = await firestoreService.saveBooking(booking);

  try {
    await notificationService.sendBookingNotifications(booking);
  } catch (error) {
    console.error("Email Error:", error.message);
  }

  return {
    id,
    ...booking,
  };
};

const getBookings = async () => {
  return firestoreService.getBookings();
};

module.exports = {
  createBooking,
  getBookings,
};