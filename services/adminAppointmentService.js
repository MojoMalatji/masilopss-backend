// services/adminAppointmentService.js

const blockerService = require("./blockerService");
const firestoreService = require("./firestoreService");
const googleCalendarService = require("./googleCalendarService");
const notificationService = require("./notificationService");

const APPOINTMENT_DURATION_MINUTES = 60;
const TIME_ZONE = "Africa/Johannesburg";

/**
 * ========================================
 * VALIDATE DATE
 * ========================================
 */
const validateDate = (date) => {
  if (!date) {
    throw new Error("Appointment date is required.");
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Invalid appointment date.");
  }

  return parsedDate;
};

/**
 * ========================================
 * VALIDATE TIME
 * ========================================
 */
const validateTime = (time) => {
  if (!time) {
    throw new Error("Appointment time is required.");
  }

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timePattern.test(time)) {
    throw new Error(
      "Invalid appointment time. Use HH:mm format."
    );
  }

  return time;
};

/**
 * ========================================
 * GET APPOINTMENT END TIME
 * ========================================
 */
const getAppointmentEndTime = (startTime) => {
  const [hours, minutes] =
    startTime.split(":").map(Number);

  const startDate = new Date();

  startDate.setHours(
    hours,
    minutes,
    0,
    0
  );

  const endDate = new Date(
    startDate.getTime() +
      APPOINTMENT_DURATION_MINUTES *
        60 *
        1000
  );

  return `${String(
    endDate.getHours()
  ).padStart(2, "0")}:${String(
    endDate.getMinutes()
  ).padStart(2, "0")}`;
};

/**
 * ========================================
 * VALIDATE FUTURE APPOINTMENT
 * ========================================
 */
const validateFutureAppointment = (
  date,
  time
) => {
  const appointmentDateTime =
    new Date(`${date}T${time}:00`);

  if (
    Number.isNaN(
      appointmentDateTime.getTime()
    )
  ) {
    throw new Error(
      "Invalid appointment date or time."
    );
  }

  if (
    appointmentDateTime.getTime() <=
    Date.now()
  ) {
    throw new Error(
      "The appointment must be scheduled for a future date and time."
    );
  }

  return appointmentDateTime;
};

/**
 * ========================================
 * CHECK COUNSELOR BLOCKER
 * ========================================
 */
const checkCounselorAvailability =
  async ({
    counselorId,
    date,
    startTime,
    endTime,
  }) => {
    const available =
      await blockerService.isCounselorAvailable({
        counselorId,
        date,
        startTime,
        endTime,
      });

    if (!available) {
      throw new Error(
        "The selected counselor is unavailable during this time because of a blocked period."
      );
    }

    return true;
  };

/**
 * ========================================
 * CHECK EXISTING COUNSELOR APPOINTMENTS
 * ========================================
 */
const checkAppointmentConflict =
  async ({
    counselorId,
    date,
    startTime,
    endTime,
  }) => {
    const bookings =
      await firestoreService.getBookings();

    const approvedBookings =
      bookings.filter((booking) => {
        return (
          booking.counselorId ===
            counselorId &&
          booking.date === date &&
          booking.status === "approved" &&
          booking.time
        );
      });

    const toMinutes = (time) => {
      const [hours, minutes] =
        time.split(":").map(Number);

      return (
        hours * 60 + minutes
      );
    };

    const newStart =
      toMinutes(startTime);

    const newEnd =
      toMinutes(endTime);

    const hasConflict =
      approvedBookings.some(
        (booking) => {
          const existingStart =
            toMinutes(booking.time);

          const existingEnd =
            existingStart +
            APPOINTMENT_DURATION_MINUTES;

          return (
            newStart < existingEnd &&
            newEnd > existingStart
          );
        }
      );

    if (hasConflict) {
      throw new Error(
        "The selected counselor already has an approved appointment during this time."
      );
    }

    return true;
  };

/**
 * ========================================
 * CREATE ADMIN APPOINTMENT
 * ========================================
 */
const createAdminAppointment =
  async (appointmentData) => {
    if (!appointmentData) {
      throw new Error(
        "Appointment data is required."
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
      counselorId,
      counselorName,
      counselorEmail,
      createdBy,
      updatedBy,
    } = appointmentData;

    /**
     * ----------------------------------------
     * BASIC VALIDATION
     * ----------------------------------------
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

    if (!service) {
      throw new Error(
        "Service is required."
      );
    }

    if (!counselorId) {
      throw new Error(
        "Counselor is required."
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

    validateDate(date);
    validateTime(time);

    /**
     * ----------------------------------------
     * FUTURE APPOINTMENT
     * ----------------------------------------
     */

    validateFutureAppointment(
      date,
      time
    );

    /**
     * ----------------------------------------
     * APPOINTMENT END TIME
     * ----------------------------------------
     */

    const endTime =
      getAppointmentEndTime(time);

    /**
     * ----------------------------------------
     * CHECK BLOCKERS
     * ----------------------------------------
     */

    await checkCounselorAvailability({
      counselorId,
      date,
      startTime: time,
      endTime,
    });

    /**
     * ----------------------------------------
     * CHECK EXISTING APPOINTMENTS
     * ----------------------------------------
     */

    await checkAppointmentConflict({
      counselorId,
      date,
      startTime: time,
      endTime,
    });

    /**
     * ----------------------------------------
     * BUILD BOOKING
     * ----------------------------------------
     */

    const booking = {
      name: name.trim(),

      email:
        email.trim().toLowerCase(),

      phone: phone.trim(),

      date,

      time,

      service,

      location:
        location?.trim() || "",

      info:
        info?.trim() || "",

      /*
       * Admin appointments are
       * immediately approved.
       */
      status: "approved",

      /*
       * This distinguishes the
       * appointment from website bookings.
       */
      source: "admin",

      counselorId,

      counselorName,

      counselorEmail,

      /*
       * Calendar details are added
       * after Google Calendar creation.
       */
      calendarEventId: null,

      googleMeetLink: null,

      createdBy:
        createdBy || "Admin",

      updatedBy:
        updatedBy || "Admin",
    };

    /**
     * ----------------------------------------
     * CREATE GOOGLE CALENDAR EVENT
     * ----------------------------------------
     */

    console.log(
      "📅 Creating Google Calendar appointment..."
    );

    const calendarResult =
      await googleCalendarService.createCalendarEvent(
        booking
      );

    console.log(
      "✅ Google Calendar appointment created."
    );

    /**
     * ----------------------------------------
     * ADD CALENDAR DETAILS
     * ----------------------------------------
     */

    booking.calendarEventId =
      calendarResult?.calendarEventId ||
      null;

    booking.googleMeetLink =
      calendarResult?.googleMeetLink ||
      null;

    /**
     * ----------------------------------------
     * SAVE FIRESTORE
     * ----------------------------------------
     */

    console.log(
      "💾 Saving admin appointment to Firestore..."
    );

    const bookingId =
      await firestoreService.saveBooking(
        booking
      );

    console.log(
      `✅ Admin appointment saved: ${bookingId}`
    );

    /**
     * ----------------------------------------
     * SAVE CALENDAR DETAILS
     * ----------------------------------------
     *
     * saveBooking() already stores these,
     * but updateCalendarDetails() keeps the
     * Calendar update logic consistent with
     * the existing booking system.
     */
    await firestoreService.updateCalendarDetails(
      bookingId,
      calendarResult
    );

    /**
     * ----------------------------------------
     * GET FINAL BOOKING
     * ----------------------------------------
     */

    const savedBooking =
      await firestoreService.getBookingById(
        bookingId
      );

    /**
     * ----------------------------------------
     * SEND EMAIL NOTIFICATIONS
     * ----------------------------------------
     *
     * The notification service receives the
     * completed approved booking.
     *
     * This sends notifications to:
     *
     * 1. Client
     * 2. Counselor
     */
    let notifications = {};

    try {
      notifications =
        await notificationService.sendApprovalNotifications(
          savedBooking
        );

      console.log(
        "📧 Admin appointment notification emails sent."
      );

      await firestoreService.updateNotificationStatus(
        bookingId,
        notifications
      );
    } catch (emailError) {
      console.error(
        "⚠️ Appointment created, but email notification failed:",
        emailError
      );

      /*
       * Do NOT delete the appointment.
       *
       * The appointment itself was successfully
       * created. Email failure is tracked
       * separately.
       */
      notifications = {
        success: false,
        error:
          emailError?.message ||
          "Appointment emails could not be sent.",
      };
    }

    /**
     * ----------------------------------------
     * RETURN RESULT
     * ----------------------------------------
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