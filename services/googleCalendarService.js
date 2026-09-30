// services/googleCalendarService.js

const { google } = require("googleapis");
const { getAuthorizedClient } = require("../config/googleAuth");

const TIME_ZONE = "Africa/Johannesburg";
const APPOINTMENT_DURATION_MINUTES = 60;
const TARGET_CALENDAR_NAME = "Info";

/**
 * ========================================
 * GET INFO CALENDAR
 * ========================================
 */
const getTargetCalendar = async () => {
  const auth = await getAuthorizedClient();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const response = await calendar.calendarList.list({
    minAccessRole: "writer",
  });

  const calendars = response.data.items || [];

  const targetCalendar = calendars.find(
    (item) =>
      item.summary?.trim().toLowerCase() ===
      TARGET_CALENDAR_NAME.toLowerCase()
  );

  if (!targetCalendar?.id) {
    console.error(
      `❌ Google Calendar "${TARGET_CALENDAR_NAME}" was not found.`
    );

    console.log("Available calendars:");

    calendars.forEach((item) => {
      console.log(
        `- ${item.summary} | ${item.id}`
      );
    });

    throw new Error(
      `Google Calendar "${TARGET_CALENDAR_NAME}" was not found or is not accessible.`
    );
  }

  console.log(
    `✅ Target calendar found: ${targetCalendar.summary}`
  );

  console.log(
    `📅 Calendar ID: ${targetCalendar.id}`
  );

  return {
    calendar,
    calendarId: targetCalendar.id,
  };
};

/**
 * ========================================
 * CREATE CALENDAR EVENT
 * ========================================
 *
 * IMPORTANT:
 *
 * The Info calendar is the CENTRAL calendar.
 *
 * One appointment = ONE Google Calendar event.
 *
 * The event is created on the Info calendar.
 *
 * The client and counselor are attendees
 * of that same event.
 *
 * We do NOT create separate events for
 * the counselor and Info.
 */
const createCalendarEvent = async (booking) => {
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
   * START / END
   * ========================================
   */

  const startDateTime =
    `${booking.date}T${booking.time}:00`;

  const start = new Date(startDateTime);

  if (Number.isNaN(start.getTime())) {
    throw new Error(
      "Invalid appointment date or time."
    );
  }

  const end = new Date(start);

  end.setMinutes(
    end.getMinutes() +
      APPOINTMENT_DURATION_MINUTES
  );

  /**
   * ========================================
   * LOCATION
   * ========================================
   */

  const location =
    booking.location?.trim() || "";

  const online =
    /online|google meet|virtual|remote/i.test(
      location
    );

  /**
   * ========================================
   * INFO CALENDAR
   * ========================================
   */

  const {
    calendar,
    calendarId,
  } = await getTargetCalendar();

  /**
   * ========================================
   * ATTENDEES
   * ========================================
   *
   * The event lives on Info.
   *
   * Counselor receives the same event.
   *
   * Client receives the same event.
   *
   * No separate counselor event is created.
   */

  const attendees = [];

  /**
   * CLIENT
   */
  if (booking.email) {
    attendees.push({
      email: booking.email.trim(),

      displayName:
        booking.name?.trim() ||
        "Client",

      responseStatus: "accepted",
    });
  }

  /**
   * COUNSELOR
   */
  if (booking.counselorEmail) {
    attendees.push({
      email:
        booking.counselorEmail.trim(),

      displayName:
        booking.counselorName?.trim() ||
        "Counselor",

      responseStatus: "accepted",
    });
  }

  /**
   * ========================================
   * EVENT
   * ========================================
   */

  const event = {
    summary:
      `Mashilo PSS - ${
        booking.service ||
        "Consultation"
      }`,

    description: `
Client: ${booking.name || "—"}
Email: ${booking.email || "—"}
Phone: ${booking.phone || "—"}

Service: ${booking.service || "—"}

Counselor: ${
      booking.counselorName || "—"
    }

Counselor Email: ${
      booking.counselorEmail || "—"
    }

Appointment Status: Approved

Appointment Source: ${
      booking.source || "admin"
    }

Additional Information:
${booking.info || "None"}

Created by:
${booking.createdBy || "Admin"}
`.trim(),

    start: {
      dateTime: start.toISOString(),
      timeZone: TIME_ZONE,
    },

    end: {
      dateTime: end.toISOString(),
      timeZone: TIME_ZONE,
    },

    attendees,

    /**
     * Tell Google that this event has
     * already been confirmed.
     */
    status: "confirmed",

    reminders: {
      useDefault: false,

      overrides: [
        {
          method: "email",
          minutes: 24 * 60,
        },
        {
          method: "popup",
          minutes: 30,
        },
      ],
    },

    /**
     * Physical appointment location.
     */
    ...(online
      ? {}
      : {
          location:
            location ||
            "Mashilo Psyché & Social Solutions",
        }),
  };

  /**
   * ========================================
   * GOOGLE MEET
   * ========================================
   */

  if (online) {
    event.conferenceData = {
      createRequest: {
        requestId:
          `mashilo-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`,

        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  /**
   * ========================================
   * LOG
   * ========================================
   */

  console.log(
    "📅 Creating central Info Calendar appointment..."
  );

  console.log(
    "Central Calendar:",
    TARGET_CALENDAR_NAME
  );

  console.log(
    "Calendar ID:",
    calendarId
  );

  console.log(
    "Client:",
    booking.email
  );

  console.log(
    "Counselor:",
    booking.counselorEmail
  );

  console.log(
    "Start:",
    startDateTime
  );

  console.log(
    "End:",
    end.toISOString()
  );

  /**
   * ========================================
   * INSERT EVENT
   * ========================================
   *
   * ONE event is created on Info.
   *
   * sendUpdates: "all" sends the event
   * invitation/update to the attendees.
   */

  const response =
    await calendar.events.insert({
      calendarId,

      resource: event,

      sendUpdates: "all",

      conferenceDataVersion:
        online ? 1 : 0,
    });

  const createdEvent =
    response.data;
console.log(
  "================ GOOGLE EVENT DEBUG ================"
);

console.log(
  "Requested calendar ID:",
  calendarId
);

console.log(
  "Requested calendar name:",
  TARGET_CALENDAR_NAME
);

console.log(
  "Created event ID:",
  createdEvent.id
);

console.log(
  "Created event organizer:",
  createdEvent.organizer
);

console.log(
  "Created event creator:",
  createdEvent.creator
);

console.log(
  "Created event attendees:",
  createdEvent.attendees
);

console.log(
  "Created event HTML link:",
  createdEvent.htmlLink
);

console.log(
  "===================================================="
);
  if (!createdEvent?.id) {
    throw new Error(
      "Google Calendar did not return an event ID."
    );
  }

  /**
   * ========================================
   * GOOGLE MEET LINK
   * ========================================
   */

  let googleMeetLink = null;

  if (
    createdEvent.conferenceData
      ?.entryPoints
  ) {
    const videoEntry =
      createdEvent.conferenceData.entryPoints.find(
        (entry) =>
          entry.entryPointType ===
          "video"
      );

    googleMeetLink =
      videoEntry?.uri || null;
  }

  /**
   * ========================================
   * RESULT
   * ========================================
   */

  console.log(
    "✅ Central Info Calendar appointment created."
  );

  console.log(
    "Event ID:",
    createdEvent.id
  );

  console.log(
    "Event URL:",
    createdEvent.htmlLink
  );

  console.log(
    "Counselor attendee:",
    booking.counselorEmail
  );

  console.log(
    "Client attendee:",
    booking.email
  );

  if (googleMeetLink) {
    console.log(
      "Google Meet:",
      googleMeetLink
    );
  }

  return {
    calendarEventId:
      createdEvent.id,

    calendarEventUrl:
      createdEvent.htmlLink ||
      null,

    googleMeetLink,

    isOnline: online,

    calendarId,

    calendarName:
      TARGET_CALENDAR_NAME,

    counselorEmail:
      booking.counselorEmail,

    clientEmail:
      booking.email,
  };
};

/**
 * ========================================
 * DELETE CALENDAR EVENT
 * ========================================
 *
 * Deletes the CENTRAL Info event.
 *
 * Because counselor and client are
 * attendees of the same event, deleting
 * this event removes it from the central
 * calendar and sends the cancellation
 * update to the attendees.
 */
const deleteCalendarEvent = async (
  eventId
) => {
  if (!eventId) {
    throw new Error(
      "Calendar event ID is required."
    );
  }

  const {
    calendar,
    calendarId,
  } = await getTargetCalendar();

  await calendar.events.delete({
    calendarId,

    eventId,

    sendUpdates: "all",
  });

  console.log(
    `🗑️ Central Info Calendar event deleted: ${eventId}`
  );

  return {
    success: true,

    calendarId,

    calendarName:
      TARGET_CALENDAR_NAME,

    calendarEventId:
      eventId,
  };
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