const firestoreService = require("./firestoreService");
const notificationService = require("./notificationService");
const googleCalendarService = require("./googleCalendarService");
const blockerService = require("./blockerService");

// ----------------------------------------
// Constants
// ----------------------------------------

const APPOINTMENT_DURATION_MINUTES = 60;
const TIME_ZONE = "Africa/Johannesburg";

// ----------------------------------------
// Date / Time Helpers
// ----------------------------------------

const validateDate = (date) => {
  if (!date) {
    throw new Error(
      "Appointment date is required."
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      "Invalid appointment date. Expected YYYY-MM-DD."
    );
  }
};

const validateTime = (time) => {
  if (!time) {
    throw new Error(
      "Appointment time is required."
    );
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(
      "Invalid appointment time. Expected HH:MM."
    );
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(
      "Invalid appointment time."
    );
  }
};

const toDateTime = (date, time) => {
  validateDate(date);
  validateTime(time);

  return new Date(
    `${date}T${time}:00+02:00`
  );
};

const getAppointmentEndTime = (
  date,
  time
) => {
  const startDateTime =
    toDateTime(date, time);

  const endDateTime =
    new Date(
      startDateTime.getTime() +
        APPOINTMENT_DURATION_MINUTES *
          60 *
          1000
    );

  const year =
    endDateTime.getFullYear();

  const month = String(
    endDateTime.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    endDateTime.getDate()
  ).padStart(2, "0");

  const hours = String(
    endDateTime.getHours()
  ).padStart(2, "0");

  const minutes = String(
    endDateTime.getMinutes()
  ).padStart(2, "0");

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
    dateTime: endDateTime,
  };
};

// ----------------------------------------
// Validate Future Appointment
// ----------------------------------------

const validateFutureAppointment = (
  date,
  time
) => {
  const appointmentDateTime =
    toDateTime(date, time);

  if (
    appointmentDateTime.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "An appointment cannot be scheduled in the past."
    );
  }

  return appointmentDateTime;
};

// ----------------------------------------
// Check Counselor Availability
// ----------------------------------------

const checkCounselorAvailability =
  async ({
    counselorId,
    date,
    time,
  }) => {
    if (!counselorId) {
      throw new Error(
        "Counselor ID is required."
      );
    }

    const end =
      getAppointmentEndTime(
        date,
        time
      );

    const availability =
      await blockerService.isCounselorAvailable(
        {
          counselorId,
          date,
          startTime: time,
          endTime: end.time,
        }
      );

    if (
      !availability?.available
    ) {
      const error = new Error(
        availability?.reason ||
          "Counselor is unavailable during this time."
      );

      error.statusCode = 409;

      throw error;
    }

    return availability;
  };

// ----------------------------------------
// Check Existing Approved Appointment
// ----------------------------------------

const checkAppointmentConflict =
  async ({
    counselorId,
    date,
    time,
    excludeBookingId = null,
  }) => {
    if (!counselorId) {
      throw new Error(
        "Counselor ID is required."
      );
    }

    const bookings =
      await firestoreService.getBookings();

    const newStart =
      toDateTime(date, time);

    const newEnd =
      new Date(
        newStart.getTime() +
          APPOINTMENT_DURATION_MINUTES *
            60 *
            1000
      );

    for (const booking of bookings) {
      if (
        booking.id ===
        excludeBookingId
      ) {
        continue;
      }

      if (
        booking.counselorId !==
        counselorId
      ) {
        continue;
      }

      if (
        booking.status !==
        "approved"
      ) {
        continue;
      }

      if (
        booking.date !==
        date
      ) {
        continue;
      }

      if (!booking.time) {
        continue;
      }

      const existingStart =
        toDateTime(
          booking.date,
          booking.time
        );

      const existingEnd =
        new Date(
          existingStart.getTime() +
            APPOINTMENT_DURATION_MINUTES *
              60 *
              1000
        );

      const overlaps =
        newStart <
          existingEnd &&
        newEnd >
          existingStart;

      if (overlaps) {
        const error = new Error(
          `This counselor already has an approved appointment at ${booking.time} on ${booking.date}.`
        );

        error.statusCode = 409;

        throw error;
      }
    }
  };

// ----------------------------------------
// CREATE WEBSITE BOOKING
// ----------------------------------------

const createBooking = async (
  bookingData
) => {
  if (!bookingData) {
    throw new Error(
      "Booking information is required."
    );
  }

  const {
    name,
    email,
    phone,
    date,
    time,
    service,
    location,
    info,
  } = bookingData;

  // --------------------------------------
  // Required fields
  // --------------------------------------

  if (!name?.trim()) {
    throw new Error(
      "Full name is required."
    );
  }

  if (!email?.trim()) {
    throw new Error(
      "Email address is required."
    );
  }

  if (!phone?.trim()) {
    throw new Error(
      "Phone number is required."
    );
  }

  if (!date) {
    throw new Error(
      "Appointment date is required."
    );
  }

  if (!time) {
    throw new Error(
      "Appointment time is required."
    );
  }

  if (!service) {
    throw new Error(
      "Service is required."
    );
  }

  if (!location) {
    throw new Error(
      "Location is required."
    );
  }

  // --------------------------------------
  // Validate date/time
  // --------------------------------------

  validateFutureAppointment(
    date,
    time
  );

  // --------------------------------------
  // Website bookings remain pending.
  //
  // We DO NOT assign a counselor.
  // We DO NOT create Calendar events.
  // We DO NOT create Google Meet.
  // --------------------------------------

  const booking = {
    name:
      name.trim(),

    email:
      email.trim().toLowerCase(),

    phone:
      phone.trim(),

    date,

    time,

    service,

    location,

    info:
      info?.trim() || "",

    status:
      "pending",

    source:
      "website",

    counselorId:
      null,

    counselorName:
      null,

    counselorEmail:
      null,

    calendarEventId:
      null,

    googleMeetLink:
      null,
  };

  // --------------------------------------
  // Save to Firestore
  // --------------------------------------

  const bookingId =
    await firestoreService.saveBooking(
      booking
    );

  const savedBooking =
    await firestoreService.getBookingById(
      bookingId
    );

  // --------------------------------------
  // Send initial notifications
  // --------------------------------------

  const notifications =
    await notificationService.sendBookingNotifications(
      savedBooking
    );

  // --------------------------------------
  // Save notification status
  // --------------------------------------

  await firestoreService.updateNotificationStatus(
    bookingId,
    {
      clientApprovalEmail:
        false,

      counselorEmail:
        false,
    }
  );

  console.log(
    `✅ Website booking created: ${bookingId}`
  );

  return savedBooking;
};

// ----------------------------------------
// GET BOOKINGS
// ----------------------------------------

const getBookings = async () => {
  return firestoreService.getBookings();
};

// ----------------------------------------
// APPROVE BOOKING
// ----------------------------------------

const approveBooking = async ({
  bookingId,
  counselorId,
  counselorName,
  counselorEmail,
}) => {
  if (!bookingId) {
    throw new Error(
      "Booking ID is required."
    );
  }

  if (!counselorId) {
    throw new Error(
      "Counselor ID is required."
    );
  }

  if (!counselorName) {
    throw new Error(
      "Counselor name is required."
    );
  }

  if (!counselorEmail) {
    throw new Error(
      "Counselor email is required."
    );
  }

  // --------------------------------------
  // Get booking
  // --------------------------------------

  const booking =
    await firestoreService.getBookingById(
      bookingId
    );

  // --------------------------------------
  // Prevent duplicate approval
  // --------------------------------------

  if (
    booking.status ===
    "approved"
  ) {
    throw new Error(
      "This booking has already been approved."
    );
  }

  if (
    booking.status ===
    "cancelled"
  ) {
    throw new Error(
      "A cancelled booking cannot be approved."
    );
  }

  // --------------------------------------
  // Validate appointment date/time
  // --------------------------------------

  validateFutureAppointment(
    booking.date,
    booking.time
  );

  // --------------------------------------
  // Check blocker availability
  // --------------------------------------

  await checkCounselorAvailability(
    {
      counselorId,
      date: booking.date,
      time: booking.time,
    }
  );

  // --------------------------------------
  // Check approved appointment conflict
  // --------------------------------------

  await checkAppointmentConflict(
    {
      counselorId,
      date: booking.date,
      time: booking.time,
      excludeBookingId:
        bookingId,
    }
  );

  // --------------------------------------
  // Prepare approved booking
  // --------------------------------------

  const bookingWithCounselor = {
    ...booking,

    counselorId,

    counselorName,

    counselorEmail,

    status:
      "approved",
  };

  // --------------------------------------
  // Create Google Calendar event
  //
  // IMPORTANT:
  // Calendar is created BEFORE marking
  // the Firestore booking approved.
  // --------------------------------------

  let calendarResult;

  try {
    calendarResult =
      await googleCalendarService.createCalendarEvent(
        bookingWithCounselor
      );
  } catch (calendarError) {
    console.error(
      "❌ Calendar creation failed during approval:",
      calendarError
    );

    throw new Error(
      calendarError?.message ||
        "Failed to create the Google Calendar appointment. The booking was not approved."
    );
  }

  // --------------------------------------
  // Update Firestore with approval
  // --------------------------------------

  let approvedBooking;

  try {
    approvedBooking =
      await firestoreService.approveBooking(
        {
          bookingId,

          counselorId,

          counselorName,

          counselorEmail,
        }
      );

    // ------------------------------------
    // Save Calendar details
    // ------------------------------------

    await firestoreService.updateCalendarDetails(
      bookingId,
      calendarResult
    );

    approvedBooking =
      await firestoreService.getBookingById(
        bookingId
      );
  } catch (firestoreError) {
    // ------------------------------------
    // Roll Calendar back if Firestore
    // approval fails.
    // ------------------------------------

    console.error(
      "❌ Failed to save approved booking. Rolling back Calendar event.",
      firestoreError
    );

    if (
      calendarResult?.calendarEventId
    ) {
      try {
        await googleCalendarService.deleteCalendarEvent(
          calendarResult.calendarEventId
        );
      } catch (rollbackError) {
        console.error(
          "❌ Calendar rollback failed:",
          rollbackError
        );
      }
    }

    throw firestoreError;
  }

  // --------------------------------------
  // Send approval notifications
  // --------------------------------------

  const notifications =
    await notificationService.sendApprovalNotifications(
      approvedBooking
    );

  // --------------------------------------
  // Save notification status
  // --------------------------------------

  await firestoreService.updateNotificationStatus(
    bookingId,
    notifications
  );

  const finalBooking =
    await firestoreService.getBookingById(
      bookingId
    );

  console.log(
    `✅ Booking approved successfully: ${bookingId}`
  );

  return {
    booking:
      finalBooking,

    calendar:
      calendarResult,

    notifications,
  };
};

// ----------------------------------------
// REJECT BOOKING
// ----------------------------------------

const rejectBooking = async ({
  bookingId,
  counselorId,
  counselorName,
  counselorEmail,
}) => {
  if (!bookingId) {
    throw new Error(
      "Booking ID is required."
    );
  }

  const booking =
    await firestoreService.getBookingById(
      bookingId
    );

  if (
    booking.status ===
    "rejected"
  ) {
    throw new Error(
      "This booking has already been rejected."
    );
  }

  if (
    booking.status ===
    "cancelled"
  ) {
    throw new Error(
      "A cancelled booking cannot be rejected."
    );
  }

  const rejectedBooking =
    await firestoreService.rejectBooking(
      {
        bookingId,

        counselorId,

        counselorName,

        counselorEmail,
      }
    );

  // --------------------------------------
  // Send rejection notifications
  // --------------------------------------

  const notifications =
    await notificationService.sendRejectionNotifications(
      rejectedBooking
    );

  // --------------------------------------
  // Save notification status
  // --------------------------------------

  await firestoreService.updateNotificationStatus(
    bookingId,
    notifications
  );

  const finalBooking =
    await firestoreService.getBookingById(
      bookingId
    );

  console.log(
    `✅ Booking rejected successfully: ${bookingId}`
  );

  return {
    booking:
      finalBooking,

    notifications,
  };
};

// ----------------------------------------
// CANCEL BOOKING
// ----------------------------------------

const cancelBooking = async (
  bookingId
) => {
  if (!bookingId) {
    throw new Error(
      "Booking ID is required."
    );
  }

  const booking =
    await firestoreService.getBookingById(
      bookingId
    );

  if (
    booking.status ===
    "cancelled"
  ) {
    return {
      booking,

      calendar: {
        deleted: false,

        reason:
          "Booking was already cancelled.",
      },

      notifications: {},
    };
  }

  // --------------------------------------
  // Delete Google Calendar event
  // --------------------------------------

  let calendarResult = {
    deleted: false,

    reason:
      "No calendar event.",
  };

  if (
    booking.calendarEventId
  ) {
    calendarResult =
      await googleCalendarService.deleteCalendarEvent(
        booking.calendarEventId
      );
  }

  // --------------------------------------
  // Mark Firestore booking cancelled
  // --------------------------------------

  const cancelledBooking =
    await firestoreService.cancelBooking(
      bookingId
    );

  console.log(
    `✅ Booking cancelled successfully: ${bookingId}`
  );

  return {
    booking:
      cancelledBooking,

    calendar:
      calendarResult,

    notifications: {},
  };
};

// ----------------------------------------
// EXPORTS
// ----------------------------------------

module.exports = {
  createBooking,
  getBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
};