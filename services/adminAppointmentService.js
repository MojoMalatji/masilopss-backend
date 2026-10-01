// services/adminAppointmentService.js

const firestoreService = require("./firestoreService");
const googleCalendarService = require("./googleCalendarService");
const notificationService = require("./notificationService");

const APPOINTMENT_DURATION_MINUTES = 60;

/**
 * ========================================
 * HELPERS
 * ========================================
 */

const createDateTime = (date, time) => {
  const dateTime = new Date(`${date}T${time}:00`);

  if (Number.isNaN(dateTime.getTime())) {
    throw new Error("Invalid appointment date or time.");
  }

  return dateTime;
};

const calculateEndTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    throw new Error("Invalid appointment time.");
  }

  const startMinutes = hours * 60 + minutes;

  const endMinutes =
    startMinutes + APPOINTMENT_DURATION_MINUTES;

  const endHours =
    Math.floor(endMinutes / 60) % 24;

  const endMinutesValue =
    endMinutes % 60;

  return `${String(endHours).padStart(
    2,
    "0"
  )}:${String(endMinutesValue).padStart(
    2,
    "0"
  )}`;
};

/**
 * ========================================
 * CREATE ADMIN APPOINTMENT
 * ========================================
 *
 * Admin-created appointments:
 *
 * - Are immediately approved
 * - Are saved to Firestore
 * - Are added to Google Calendar
 * - Counselor is an attendee
 * - Client is an attendee
 *
 * No availability checking is performed here.
 */

const createAdminAppointment = async (
  appointmentData
) => {
  const {
    name,
    email,
    phone,
    date,
    time,
    service,
    location,
    info,
    counselorId,
    counselorName,
    counselorEmail,
    createdBy,
    updatedBy,
  } = appointmentData || {};

  /**
   * ========================================
   * REQUIRED FIELD VALIDATION
   * ========================================
   */

  if (!name?.trim()) {
    throw new Error("Client name is required.");
  }

  if (!email?.trim()) {
    throw new Error("Client email is required.");
  }

  if (!phone?.trim()) {
    throw new Error("Client phone number is required.");
  }

  if (!date) {
    throw new Error("Appointment date is required.");
  }

  if (!time) {
    throw new Error("Appointment time is required.");
  }

  if (!service) {
    throw new Error("Appointment service is required.");
  }

  if (!counselorId) {
    throw new Error("Counselor is required.");
  }

  if (!counselorName?.trim()) {
    throw new Error("Counselor name is required.");
  }

  if (!counselorEmail?.trim()) {
    throw new Error("Counselor email is required.");
  }

  /**
   * ========================================
   * NORMALIZE VALUES
   * ========================================
   */

  const normalizedName = name.trim();

  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedPhone = phone.trim();

  const normalizedCounselorName =
    counselorName.trim();

  const normalizedCounselorEmail =
    counselorEmail.trim().toLowerCase();

  /**
   * ========================================
   * DATE / TIME VALIDATION
   * ========================================
   */

  const startDateTime = createDateTime(
    date,
    time
  );

  const now = new Date();

  if (startDateTime <= now) {
    throw new Error(
      "The appointment date and time must be in the future."
    );
  }

  /**
   * ========================================
   * CALCULATE END TIME
   * ========================================
   */

  const endTime = calculateEndTime(time);

  /**
   * ========================================
   * BUILD BOOKING
   * ========================================
   */

  const booking = {
    name: normalizedName,

    email: normalizedEmail,

    phone: normalizedPhone,

    date,

    time,

    endTime,

    service,

    location: location?.trim() || "",

    info: info?.trim() || "",

    status: "approved",

    source: "admin",

    counselorId,

    counselorName:
      normalizedCounselorName,

    counselorEmail:
      normalizedCounselorEmail,

    calendarEventId: null,

    googleMeetLink: null,

    createdBy:
      createdBy || "Admin",

    updatedBy:
      updatedBy || "Admin",
  };

  console.log(
    "📅 Creating admin appointment:",
    booking
  );

  /**
   * ========================================
   * CREATE GOOGLE CALENDAR EVENT
   * ========================================
   *
   * The googleCalendarService is responsible
   * for creating the event on the configured
   * primary Google Calendar.
   */

  let calendarResult = null;

  try {
    calendarResult =
      await googleCalendarService.createCalendarEvent(
        booking
      );

    console.log(
      "✅ Google Calendar event created:",
      calendarResult
    );
  } catch (error) {
    console.error(
      "❌ Google Calendar event creation failed:",
      error
    );

    throw new Error(
      `Appointment could not be added to Google Calendar: ${
        error?.message ||
        "Unknown Google Calendar error."
      }`
    );
  }

  /**
   * ========================================
   * ADD CALENDAR DETAILS TO BOOKING
   * ========================================
   */

  if (calendarResult) {
    booking.calendarEventId =
      calendarResult.calendarEventId ||
      null;

    booking.googleMeetLink =
      calendarResult.googleMeetLink ||
      null;
  }

  /**
   * ========================================
   * SAVE BOOKING TO FIRESTORE
   * ========================================
   *
   * IMPORTANT:
   *
   * The Firestore service uses:
   *
   * firestoreService.saveBooking()
   *
   * NOT createBooking().
   */

  let bookingId;

  try {
    bookingId =
      await firestoreService.saveBooking(
        booking
      );

    console.log(
      `✅ Admin appointment saved to Firestore: ${bookingId}`
    );
  } catch (error) {
    console.error(
      "❌ Failed to save admin appointment to Firestore:",
      error
    );

    /**
     * Remove the Calendar event if Firestore
     * could not save the appointment.
     */
    if (
      calendarResult?.calendarEventId
    ) {
      try {
        await googleCalendarService.deleteCalendarEvent(
          calendarResult.calendarEventId
        );

        console.log(
          "🗑️ Orphan Google Calendar event removed."
        );
      } catch (cleanupError) {
        console.error(
          "❌ Failed to remove orphan Calendar event:",
          cleanupError
        );
      }
    }

    throw new Error(
      `Appointment could not be saved: ${
        error?.message ||
        "Unknown Firestore error."
      }`
    );
  }

  /**
   * ========================================
   * SAVE CALENDAR DETAILS
   * ========================================
   *
   * Firestore saveBooking() creates the
   * appointment first.
   *
   * Then we update the same document with
   * the Calendar event information.
   */

  if (calendarResult) {
    try {
      await firestoreService.updateCalendarDetails(
        bookingId,
        calendarResult
      );

      console.log(
        "✅ Calendar details saved to booking."
      );
    } catch (error) {
      console.error(
        "⚠️ Failed to update calendar details:",
        error
      );

      /**
       * Do not fail the appointment here.
       *
       * The appointment already exists in
       * Firestore and the Calendar event exists.
       */
    }
  }

  /**
   * ========================================
   * GET FINAL BOOKING
   * ========================================
   */

  let savedBooking;

  try {
    savedBooking =
      await firestoreService.getBookingById(
        bookingId
      );
  } catch (error) {
    console.error(
      "⚠️ Could not reload saved booking:",
      error
    );

    savedBooking = {
      ...booking,
      id: bookingId,
    };
  }

  /**
   * ========================================
   * SEND ADMIN APPOINTMENT NOTIFICATIONS
   * ========================================
   */

  let notifications = null;

  try {
    notifications =
      await notificationService.sendAdminAppointmentNotifications(
        savedBooking
      );

    console.log(
      "📧 Admin appointment notifications:",
      notifications
    );
  } catch (error) {
    console.error(
      "⚠️ Admin appointment notification process failed:",
      error
    );

    /**
     * Notification failure does not invalidate
     * the appointment.
     */
  }

  /**
   * ========================================
   * FINAL RESPONSE
   * ========================================
   */

  return {
    success: true,

    message:
      "Appointment created successfully.",

    booking: savedBooking,

    calendar: calendarResult,

    notifications,
  };
};

/**
 * ========================================
 * EXPORTS
 * ========================================
 */

module.exports = {
  createAdminAppointment,
};