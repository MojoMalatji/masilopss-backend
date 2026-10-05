const { google } = require("googleapis");

const {
  getAuthorizedClient,
} = require("../config/googleAuth");

const TIME_ZONE = "Africa/Johannesburg";

// ========================================
// CREATE CALENDAR BLOCKER
// ========================================

const createBlockerCalendarEvent = async (
  blocker
) => {
  if (!blocker) {
    throw new Error(
      "Blocker information is required."
    );
  }

  const auth =
    await getAuthorizedClient();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const startDateTime =
    `${blocker.date}T${blocker.startTime}:00`;

  const endDateTime =
    `${blocker.date}T${blocker.endTime}:00`;

  const attendees = [];

  // ----------------------------------------
  // INFO
  // ----------------------------------------

  if (blocker.infoEmail) {
    attendees.push({
      email: blocker.infoEmail,
      displayName:
        blocker.infoName ||
        "Mashilo Psyché & Social Solutions",
    });
  }

  // ----------------------------------------
  // COUNSELOR
  // ----------------------------------------

  if (blocker.counselorEmail) {
    attendees.push({
      email: blocker.counselorEmail,
      displayName:
        blocker.counselorName ||
        "Counselor",
    });
  }

  // ========================================
  // CALENDAR EVENT
  // ========================================

  const event = {
    // --------------------------------------
    // TITLE = BLOCKER REASON
    // --------------------------------------

    summary:
      blocker.reason?.trim() ||
      "Unavailable",

    // --------------------------------------
    // DESCRIPTION
    // --------------------------------------

    description: `
Mashilo Psyché & Social Solutions

COUNSELOR AVAILABILITY BLOCK

Counselor:
${blocker.counselorName || "N/A"}

Reason:
${blocker.reason?.trim() || "Not specified"}

Date:
${blocker.date}

Unavailable:
${blocker.startTime} - ${blocker.endTime}

Blocker ID:
${blocker.id || "N/A"}
    `.trim(),

    // --------------------------------------
    // START
    // --------------------------------------

    start: {
      dateTime: startDateTime,
      timeZone: TIME_ZONE,
    },

    // --------------------------------------
    // END
    // --------------------------------------

    end: {
      dateTime: endDateTime,
      timeZone: TIME_ZONE,
    },

    // --------------------------------------
    // ATTENDEES
    // --------------------------------------

    attendees,

    // --------------------------------------
    // REMINDERS
    // --------------------------------------

    reminders: {
      useDefault: true,
    },
  };

  console.log(
    `📅 Creating counselor blocker calendar event: ${
      blocker.reason?.trim() || "Unavailable"
    }`
  );

  const response =
    await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

  const createdEvent = response.data;

  console.log(
    `✅ Calendar blocker created: ${createdEvent.id}`
  );

  return {
    calendarEventId:
      createdEvent.id,

    calendarEventUrl:
      createdEvent.htmlLink || null,
  };
};

// ========================================
// DELETE CALENDAR BLOCKER
// ========================================

const deleteBlockerCalendarEvent =
  async (calendarEventId) => {
    if (!calendarEventId) {
      return {
        deleted: false,
        reason:
          "No Google Calendar event ID.",
      };
    }

    const auth =
      await getAuthorizedClient();

    const calendar = google.calendar({
      version: "v3",
      auth,
    });

    try {
      await calendar.events.delete({
        calendarId: "primary",

        eventId: calendarEventId,

        sendUpdates: "all",
      });

      console.log(
        `✅ Google Calendar blocker deleted: ${calendarEventId}`
      );

      return {
        deleted: true,
        calendarEventId,
      };
    } catch (error) {
      // --------------------------------------
      // ALREADY DELETED
      // --------------------------------------

      if (error?.code === 404) {
        console.log(
          "ℹ️ Google Calendar blocker was already deleted."
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

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createBlockerCalendarEvent,
  deleteBlockerCalendarEvent,
};