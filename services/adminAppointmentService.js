// services/adminAppointmentService.js

const blockerService = require("./blockerService");
const firestoreService = require("./firestoreService");
const googleCalendarService = require("./googleCalendarService");
const notificationService = require("./notificationService");

const APPOINTMENT_DURATION_MINUTES = 60;

/**
 * ========================================
 * VERIFY GOOGLE CALENDAR SERVICE
 * ========================================
 */

console.log(
  "📦 Google Calendar service exports:",
  Object.keys(googleCalendarService)
);

if (
  typeof googleCalendarService.createCalendarEvent !==
  "function"
) {
  throw new Error(
    "googleCalendarService.createCalendarEvent is not available. Check services/googleCalendarService.js exports."
  );
}

/**
 * ========================================
 * VALIDATE DATE
 * ========================================
 */

const validateDate = (date) => {
  if (!date) {
    throw new Error(
      "Appointment date is required."
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error(
      "Invalid appointment date. Expected YYYY-MM-DD."
    );
  }

  const parsedDate = new Date(
    `${date}T00:00:00`
  );

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    throw new Error(
      "Invalid appointment date."
    );
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
    throw new Error(
      "Appointment time is required."
    );
  }

  const timePattern =
    /^([01]\d|2[0-3]):([0-5]\d)$/;

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

const getAppointmentEndTime = (
  startTime
) => {
  const [
    hours,
    minutes,
  ] = startTime
    .split(":")
    .map(Number);

  const totalMinutes =
    hours * 60 +
    minutes +
    APPOINTMENT_DURATION_MINUTES;

  const endHours =
    Math.floor(totalMinutes / 60) %
    24;

  const endMinutes =
    totalMinutes % 60;

  return `${String(
    endHours
  ).padStart(
    2,
    "0"
  )}:${String(
    endMinutes
  ).padStart(
    2,
    "0"
  )}`;
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
    new Date(
      `${date}T${time}:00`
    );

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
    console.log(
      "🔎 Checking counselor blocker availability..."
    );

    const available =
      await blockerService.isCounselorAvailable(
        {
          counselorId,
          date,
          startTime,
          endTime,
        }
      );

    console.log(
      "🔎 Counselor available:",
      available
    );

    if (!available) {
      throw new Error(
        "The selected counselor is unavailable during this time because of a blocked period."
      );
    }

    return true;
  };

/**
 * ========================================
 * CHECK EXISTING APPOINTMENTS
 * ========================================
 */

const checkAppointmentConflict =
  async ({
    counselorId,
    date,
    startTime,
    endTime,
  }) => {
    console.log(
      "🔎 Checking existing counselor appointments..."
    );

    const bookings =
      await firestoreService.getBookings();

    const approvedBookings =
      bookings.filter(
        (booking) =>
          booking.counselorId ===
            counselorId &&
          booking.date === date &&
          booking.status ===
            "approved" &&
          booking.time
      );

    const toMinutes = (
      time
    ) => {
      const [
        hours,
        minutes,
      ] = time
        .split(":")
        .map(Number);

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
            toMinutes(
              booking.time
            );

          const existingEnd =
            existingStart +
            APPOINTMENT_DURATION_MINUTES;

          return (
            newStart <
              existingEnd &&
            newEnd >
              existingStart
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
    console.log(
      "========================================"
    );

    console.log(
      "📅 ADMIN APPOINTMENT CREATION STARTED"
    );

    console.log(
      "========================================"
    );

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

    /**
     * ----------------------------------------
     * VALIDATE DATE / TIME
     * ----------------------------------------
     */

    validateDate(date);

    validateTime(time);

    validateFutureAppointment(
      date,
      time
    );

    /**
     * ----------------------------------------
     * CALCULATE END TIME
     * ----------------------------------------
     */

    const endTime =
      getAppointmentEndTime(time);

    console.log(
      `🕐 Appointment: ${date} ${time} - ${endTime}`
    );

    console.log(
      `👤 Counselor: ${counselorName} (${counselorId})`
    );

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
     * CHECK APPOINTMENT CONFLICT
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
        email
          .trim()
          .toLowerCase(),

      phone: phone.trim(),

      date,

      time,

      service,

      location:
        location?.trim() || "",

      info:
        info?.trim() || "",

      status: "approved",

      source: "admin",

      counselorId,

      counselorName,

      counselorEmail,

      calendarEventId:
        null,

      googleMeetLink:
        null,

      createdBy:
        createdBy ||
        "Admin",

      updatedBy:
        updatedBy ||
        "Admin",
    };

    /**
     * ----------------------------------------
     * CREATE GOOGLE CALENDAR EVENT
     * ----------------------------------------
     */

    console.log(
      "📅 Creating Google Calendar appointment..."
    );

    console.log(
      "📦 Calendar service function:",
      typeof googleCalendarService.createCalendarEvent
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
     * SAVE CALENDAR DETAILS
     * ----------------------------------------
     */

    booking.calendarEventId =
      calendarResult
        ?.calendarEventId ||
      null;

    booking.googleMeetLink =
      calendarResult
        ?.googleMeetLink ||
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
     * UPDATE CALENDAR DETAILS
     * ----------------------------------------
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
     * SEND APPROVAL NOTIFICATIONS
     * ----------------------------------------
     */

    let notifications = {};

    try {
      console.log(
        "📧 Sending appointment notification emails..."
      );

      notifications =
        await notificationService.sendApprovalNotifications(
          savedBooking
        );

      await firestoreService.updateNotificationStatus(
        bookingId,
        notifications
      );

      console.log(
        "✅ Appointment notification processing completed."
      );
    } catch (emailError) {
      console.error(
        "⚠️ Appointment created, but email notification failed:",
        emailError
      );

      notifications = {
        success: false,

        error:
          emailError?.message ||
          "Appointment emails could not be sent.",
      };
    }

    /**
     * ----------------------------------------
     * SUCCESS
     * ----------------------------------------
     */

    console.log(
      "========================================"
    );

    console.log(
      `✅ ADMIN APPOINTMENT CREATED: ${bookingId}`
    );

    console.log(
      "========================================"
    );

    return {
      success: true,

      message:
        "Appointment created successfully.",

      booking: {
        ...savedBooking,

        calendarEventId:
          calendarResult
            ?.calendarEventId ||
          savedBooking
            ?.calendarEventId ||
          null,

        googleMeetLink:
          calendarResult
            ?.googleMeetLink ||
          savedBooking
            ?.googleMeetLink ||
          null,
      },

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