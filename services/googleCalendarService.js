// services/googleCalendarService.js

const { google } = require("googleapis");

const {
  getAuthorizedClient,
} = require("../config/googleAuth");

const TIME_ZONE =
  "Africa/Johannesburg";

const INFO_EMAIL =
  "info@mashilopss.co.za";

/**
 * ========================================
 * CREATE CALENDAR EVENT
 * ========================================
 */

const createCalendarEvent = async (
  booking
) => {
  if (!booking) {
    throw new Error(
      "Booking information is required."
    );
  }

  if (!booking.date) {
    throw new Error(
      "Appointment date is required."
    );
  }

  if (!booking.time) {
    throw new Error(
      "Appointment time is required."
    );
  }

  if (!booking.email) {
    throw new Error(
      "Client email is required."
    );
  }

  if (!booking.counselorEmail) {
    throw new Error(
      "Counselor email is required."
    );
  }

  /**
   * ========================================
   * GOOGLE AUTH
   * ========================================
   */

  const auth =
    await getAuthorizedClient();

  const calendar =
    google.calendar({
      version: "v3",
      auth,
    });

  /**
   * ========================================
   * START / END TIME
   * ========================================
   */

  const startDateTime =
    `${booking.date}T${booking.time}:00`;

  const endTime =
    booking.endTime ||
    calculateEndTime(
      booking.time
    );

  const endDateTime =
    `${booking.date}T${endTime}:00`;

  /**
   * ========================================
   * ATTENDEES
   * ========================================
   */

  const attendees = [];

  // INFO
  attendees.push({
    email: INFO_EMAIL,
    displayName:
      "Mashilo Psyché & Social Solutions",
  });

  // COUNSELOR
  if (booking.counselorEmail) {
    attendees.push({
      email:
        booking.counselorEmail,
      displayName:
        booking.counselorName ||
        "Counselor",
    });
  }

  // CLIENT
  if (booking.email) {
    attendees.push({
      email:
        booking.email,
      displayName:
        booking.name ||
        "Client",
    });
  }

  /**
   * ========================================
   * EVENT
   * ========================================
   */

  const event = {
    summary:
      `Appointment - ${
        booking.name || "Client"
      }`,

    description: `
Mashilo Psyché & Social Solutions

APPOINTMENT

Client:
${booking.name || "N/A"}

Email:
${booking.email || "N/A"}

Phone:
${booking.phone || "N/A"}

Service:
${booking.service || "N/A"}

Counselor:
${booking.counselorName || "N/A"}

Date:
${booking.date}

Time:
${booking.time} - ${endTime}

Location:
${booking.location || "N/A"}

Additional Information:
${booking.info || "None"}
    `.trim(),

    start: {
      dateTime:
        startDateTime,
      timeZone:
        TIME_ZONE,
    },

    end: {
      dateTime:
        endDateTime,
      timeZone:
        TIME_ZONE,
    },

    location:
      booking.location || undefined,

    attendees,

    reminders: {
      useDefault: true,
    },
  };

  console.log(
    "📅 Creating appointment on primary Google Calendar..."
  );

  console.log(
    "👥 Calendar attendees:",
    attendees
  );

  /**
   * ========================================
   * CREATE EVENT
   * ========================================
   *
   * EXACT SAME CALENDAR MECHANISM
   * USED BY THE WORKING BLOCKER.
   */

  const response =
    await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

  const createdEvent =
    response.data;

  console.log(
    `✅ Appointment calendar event created: ${createdEvent.id}`
  );

  return {
    calendarEventId:
      createdEvent.id,

    calendarEventUrl:
      createdEvent.htmlLink ||
      null,

    googleMeetLink:
      createdEvent.hangoutLink ||
      null,
  };
};

/**
 * ========================================
 * CALCULATE END TIME
 * ========================================
 */

const calculateEndTime = (
  time
) => {
  const [hours, minutes] =
    time.split(":").map(Number);

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
    startMinutes + 60;

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
 * DELETE CALENDAR EVENT
 * ========================================
 */

const deleteCalendarEvent = async (
  calendarEventId
) => {
  if (!calendarEventId) {
    return {
      deleted: false,
      reason:
        "No Google Calendar event ID.",
    };
  }

  const auth =
    await getAuthorizedClient();

  const calendar =
    google.calendar({
      version: "v3",
      auth,
    });

  try {
    await calendar.events.delete({
      calendarId: "primary",
      eventId:
        calendarEventId,
      sendUpdates: "all",
    });

    console.log(
      `✅ Google Calendar appointment deleted: ${calendarEventId}`
    );

    return {
      deleted: true,
      calendarEventId,
    };
  } catch (error) {
    if (
      error?.code === 404
    ) {
      console.log(
        "ℹ️ Google Calendar appointment was already deleted."
      );

      return {
        deleted: true,
        alreadyDeleted: true,
        calendarEventId,
      };
    }

    throw error;
  }
};

/**
 * ========================================
 * EXPORTS
 * ========================================
 */

module.exports = {
  createCalendarEvent,
  deleteCalendarEvent,
};