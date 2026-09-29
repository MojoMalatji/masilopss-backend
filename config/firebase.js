const db = require("../config/firebase");

const saveBooking = async (booking) => {
  const now = new Date();

  const bookingData = {
    // Customer details
    name: booking.name?.trim() || "",
    email: booking.email?.trim().toLowerCase() || "",
    phone: booking.phone?.trim() || "",

    // Appointment details
    date: booking.date || "",
    time: booking.time || "",
    service: booking.service || "",
    location: booking.location || "",
    info: booking.info?.trim() || "",

    // Booking status
    status: "pending",

    // Counselor assignment
    counselorId: null,
    counselorName: null,
    counselorEmail: null,

    // Google Calendar / Google Meet
    calendarEventId: null,
    googleMeetLink: null,

    // Notification tracking
    emailNotificationSent: false,
    whatsappNotificationSent: false,

    // Source
    source: "website",

    // Timestamps
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db
    .collection("bookings")
    .add(bookingData);

  return docRef.id;
};

const getBookings = async () => {
  const snapshot = await db
    .collection("bookings")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

module.exports = {
  saveBooking,
  getBookings,
};