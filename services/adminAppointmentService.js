// services/adminAppointmentService.js

const blockerService = require("./blockerService");
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
  const dateTime = new Date(
    `${date}T${time}:00`
  );

  if (Number.isNaN(dateTime.getTime())) {
    throw new Error(
      "Invalid appointment date or time."
    );
  }

  return dateTime;
};

const calculateEndTime = (time) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    throw new Error(
      "Invalid appointment time."
    );
  }

  const startMinutes =
    hours * 60 + minutes;

  const endMinutes =
    startMinutes +
    APPOINTMENT_DURATION_MINUTES;

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
 * Admin-created appointments are:
 *
 * - Immediately approved
 * - Added to the central Info calendar
 * - Counselor added as attendee
 * - Client added as attendee
 * - No approval step required
 *
 * The Google Calendar service creates
 * ONE central event on Info.
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
    throw new Error(
      "Client name is required."
    );
  }

  if (!email?.trim()) {
    throw new Error(
      "Client email is required."
    );
  }

  if (!phone?.trim()) {
    throw new Error(
      "Client phone number is required."
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
      "Appointment service is required."
    );
  }

  if (!counselorId) {
    throw new Error(
      "Counselor is required."
    );
  }

  if (!counselorName?.trim()) {
    throw new Error(
      "Counselor name is required."
    );
  }

  if (!counselorEmail?.trim()) {
    throw new Error(
      "Counselor email is required."
    );
  }

  /**
   * ========================================
   * NORMALIZE VALUES
   * ========================================
   */

  const normalizedName =
    name.trim();

  const normalizedEmail =
    email.trim();

  const normalizedPhone =
    phone.trim();

  const normalizedCounselorName =
    counselorName.trim();

  const normalizedCounselorEmail =
    counselorEmail.trim();

  /**
   * ========================================
   * DATE / TIME VALIDATION
   * ========================================
   */

  const startDateTime =
    createDateTime(
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

  const endTime =
    calculateEndTime(time);

  /**
   * ========================================
   * CHECK COUNSELOR AVAILABILITY
   * ========================================
   */

  const counselorAvailability =
    await blockerService.isCounselorAvailable(
      counselorId,
      date,
      time,
      endTime
    );

  if (!counselorAvailability) {
    throw new Error(
      "The selected counselor is not available at this time."
    );
  }

  /**
   * ========================================
   * CHECK EXISTING APPROVED BOOKINGS
   * ========================================
   */

  const existingAppointments =
    await firestoreService.getBookingsByDate(
      date
    );

  const conflictingAppointment =
    existingAppointments.find(
      (appointment) => {
        if (
          appointment.status !==
          "approved"
        ) {
          return false;
        }

        if (
          appointment.counselorId !==
          counselorId
        ) {
          return false;
        }

        if (!appointment.time) {
          return false;
        }

        const existingStart =
          createDateTime(
            appointment.date,
            appointment.time
          );

        const existingEndTime =
          appointment.endTime ||
          calculateEndTime(
            appointment.time
          );

        const existingEnd =
          createDateTime(
            appointment.date,
            existingEndTime
          );

        const newEnd =
          createDateTime(
            date,
            endTime
          );

        return (
          startDateTime <
            existingEnd &&
          newEnd >
            existingStart
        );
      }
    );

  if (conflictingAppointment) {
    throw new Error(
      "The counselor already has an appointment scheduled during this time."
    );
  }

  /**
   * ========================================
   * BUILD BOOKING
   * ========================================
   *
   * IMPORTANT:
   *
   * Admin appointments are approved
   * immediately.
   */
  const booking = {
    name:
      normalizedName,

    email:
      normalizedEmail,

    phone:
      normalizedPhone,

    date,

    time,

    endTime,

    service,

    location:
      location?.trim() || "",

    info:
      info?.trim() || "",

    status:
      "approved",

    source:
      "admin",

    counselorId,

    counselorName:
      normalizedCounselorName,

    counselorEmail:
      normalizedCounselorEmail,

    calendarEventId:
      null,

    googleMeetLink:
      null,

    calendarEventUrl:
      null,

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
   * CREATE CENTRAL INFO CALENDAR EVENT
   * ========================================
   *
   * This creates ONE event on the Info
   * calendar.
   *
   * The counselor and client are attendees
   * of that same event.
   *
   * No approval is required.
   */

  let calendarResult = null;

  try {
    calendarResult =
      await googleCalendarService.createCalendarEvent(
        booking
      );

    console.log(
      "✅ Central Info Calendar event created:",
      calendarResult
    );
  } catch (error) {
    console.error(
      "❌ Google Calendar event creation failed:",
      error.message
    );

    throw new Error(
      `Appointment could not be added to Google Calendar: ${error.message}`
    );
  }

  /**
   * ========================================
   * SAVE CALENDAR DETAILS
   * ========================================
   */

  if (calendarResult) {
    booking.calendarEventId =
      calendarResult.calendarEventId ||
      null;

    booking.googleMeetLink =
      calendarResult.googleMeetLink ||
      null;

    booking.calendarEventUrl =
      calendarResult.calendarEventUrl ||
      null;
  }

  /**
   * ========================================
   * SAVE BOOKING TO FIRESTORE
   * ========================================
   */

  let bookingId;

  try {
    bookingId =
      await firestoreService.createBooking(
        booking
      );

    console.log(
      `✅ Admin appointment saved to Firestore: ${bookingId}`
    );
  } catch (error) {
    console.error(
      "❌ Failed to save admin appointment to Firestore:",
      error.message
    );

    /**
     * Clean up the central Info event
     * if Firestore fails.
     */
    if (
      calendarResult?.calendarEventId
    ) {
      try {
        await googleCalendarService.deleteCalendarEvent(
          calendarResult.calendarEventId
        );

        console.log(
          "🗑️ Orphan Info Calendar event removed."
        );
      } catch (cleanupError) {
        console.error(
          "❌ Failed to remove orphan Calendar event:",
          cleanupError.message
        );
      }
    }

    throw new Error(
      `Appointment could not be saved: ${error.message}`
    );
  }

  /**
   * ========================================
   * UPDATE CALENDAR DETAILS
   * ========================================
   */

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
      error.message
    );

    /**
     * Do not fail the appointment.
     *
     * The appointment and Google Calendar
     * event already exist.
     */
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
      error.message
    );

    savedBooking = {
      ...booking,
      id: bookingId,
    };
  }

  /**
   * ========================================
   * ADMIN APPOINTMENT NOTIFICATIONS
   * ========================================
   *
   * IMPORTANT:
   *
   * Do NOT call sendApprovalNotifications().
   *
   * Admin appointments are already approved.
   *
   * Use the "Appointment Scheduled"
   * notification instead.
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
      error.message
    );

    /**
     * Notification failure does not
     * invalidate the appointment.
     */
  }

  /**
   * ========================================
   * FINAL RESPONSE
   * ========================================
   */

  return {
    success:
      true,

    message:
      "Appointment created successfully.",

    booking:
      savedBooking,

    calendar:
      calendarResult,

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