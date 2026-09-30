// services/googleCalendarService.js

const { google } = require("googleapis");

const {
  getAuthorizedClient,
} = require("../config/googleAuth");

// ========================================
// CONFIGURATION
// ========================================

const TIME_ZONE =
  "Africa/Johannesburg";

const APPOINTMENT_DURATION_MINUTES = 60;

const CALENDAR_ID = "primary";

// ========================================
// HELPERS
// ========================================

const isOnlineAppointment = (
  location
) => {
  if (!location) {
    return false;
  }

  const normalizedLocation =
    String(location)
      .trim()
      .toLowerCase();

  return (
    normalizedLocation.includes(
      "online"
    ) ||
    normalizedLocation.includes(
      "virtual"
    ) ||
    normalizedLocation.includes(
      "remote"
    ) ||
    normalizedLocation.includes(
      "google meet"
    )
  );
};

// ----------------------------------------
// Validate date
// ----------------------------------------

const validateDate = (date) => {
  if (!date) {
    throw new Error(
      "Appointment date is required."
    );
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      date
    )
  ) {
    throw new Error(
      "Invalid appointment date. Expected YYYY-MM-DD."
    );
  }
};

// ----------------------------------------
// Validate time
// ----------------------------------------

const validateTime = (time) => {
  if (!time) {
    throw new Error(
      "Appointment time is required."
    );
  }

  if (
    !/^\d{2}:\d{2}$/.test(
      time
    )
  ) {
    throw new Error(
      "Invalid appointment time. Expected HH:MM."
    );
  }

  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

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

// ----------------------------------------
// Calculate end time
// ----------------------------------------

const getAppointmentEndTime = (
  time
) => {
  const [
    hours,
    minutes,
  ] = time
    .split(":")
    .map(Number);

  const totalMinutes =
    hours * 60 +
    minutes +
    APPOINTMENT_DURATION_MINUTES;

  const endHours =
    Math.floor(
      totalMinutes / 60
    ) % 24;

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

// ----------------------------------------
// Build attendee
// ----------------------------------------

const buildAttendee = (
  email,
  displayName
) => {
  if (!email) {
    return null;
  }

  return {
    email,
    ...(displayName
      ? {
          displayName,
        }
      : {}),
  };
};

// ========================================
// CREATE CALENDAR EVENT
// ========================================

const createCalendarEvent =
  async (booking) => {
    if (!booking) {
      throw new Error(
        "Booking information is required to create a calendar event."
      );
    }

    const {
      id,
      name,
      email,
      phone,
      date,
      time,
      service,
      location,
      info,
      counselorName,
      counselorEmail,
    } = booking;

    // ------------------------------------
    // Validate required information
    // ------------------------------------

    validateDate(date);
    validateTime(time);

    if (!email) {
      throw new Error(
        "Client email is required to create the calendar event."
      );
    }

    if (!counselorEmail) {
      throw new Error(
        "Counselor email is required to create the calendar event."
      );
    }

    // ------------------------------------
    // Determine online/in-person
    // ------------------------------------

    const online =
      isOnlineAppointment(
        location
      );

    // ------------------------------------
    // Calculate end time
    // ------------------------------------

    const endTime =
      getAppointmentEndTime(
        time
      );

    // ------------------------------------
    // Google authentication
    // ------------------------------------

    console.log(
      "🔐 Authorizing Google Calendar..."
    );

    const auth =
      await getAuthorizedClient();

    if (!auth) {
      throw new Error(
        "Unable to authorize Google Calendar."
      );
    }

    // ------------------------------------
    // Google Calendar client
    // ------------------------------------

    const calendar =
      google.calendar({
        version: "v3",
        auth,
      });

    // ------------------------------------
    // Attendees
    // ------------------------------------

    const attendees = [
      buildAttendee(
        email,
        name || "Client"
      ),

      buildAttendee(
        counselorEmail,
        counselorName ||
          "Counselor"
      ),
    ].filter(Boolean);

    // ------------------------------------
    // Event description
    // ------------------------------------

    const descriptionParts = [
      `Client: ${
        name || "Not provided"
      }`,

      `Email: ${
        email || "Not provided"
      }`,

      `Phone: ${
        phone || "Not provided"
      }`,

      `Counselor: ${
        counselorName ||
        "Not assigned"
      }`,

      `Counselor Email: ${
        counselorEmail ||
        "Not provided"
      }`,

      `Service: ${
        service ||
        "Consultation"
      }`,

      `Location: ${
        location ||
        "Mashilo Psyché & Social Solutions"
      }`,

      info
        ? `Additional Information:\n${info}`
        : null,

      id
        ? `Booking ID: ${id}`
        : null,
    ].filter(Boolean);

    // ------------------------------------
    // Base event
    // ------------------------------------

    const event = {
      summary: `Mashilo PSS - ${
        service ||
        "Consultation"
      }`,

      description:
        descriptionParts.join(
          "\n"
        ),

      start: {
        dateTime: `${date}T${time}:00`,
        timeZone: TIME_ZONE,
      },

      end: {
        dateTime: `${date}T${endTime}:00`,
        timeZone: TIME_ZONE,
      },

      attendees,

      reminders: {
        useDefault: true,
      },

      guestsCanModify: false,

      guestsCanInviteOthers: false,

      guestsCanSeeOtherGuests: true,
    };

    // ====================================
    // ONLINE APPOINTMENT
    // ====================================

    if (online) {
      console.log(
        "🌐 Creating online appointment with Google Meet..."
      );

      event.conferenceData = {
        createRequest: {
          requestId: `mashilo-${id || "appointment"}-${Date.now()}`,

          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      };
    }

    // ====================================
    // IN-PERSON APPOINTMENT
    // ====================================

    if (!online) {
      event.location =
        location ||
        "Mashilo Psyché & Social Solutions";
    }

    // ====================================
    // CREATE EVENT
    // ====================================

    console.log(
      "📅 Creating Google Calendar event..."
    );

    const response =
      await calendar.events.insert({
        calendarId:
          CALENDAR_ID,

        requestBody:
          event,

        sendUpdates: "all",

        conferenceDataVersion:
          online ? 1 : 0,
      });

    const createdEvent =
      response.data;

    if (!createdEvent?.id) {
      throw new Error(
        "Google Calendar did not return an event ID."
      );
    }

    // ====================================
    // GOOGLE MEET LINK
    // ====================================

    let googleMeetLink =
      null;

    if (online) {
      googleMeetLink =
        createdEvent
          ?.conferenceData
          ?.entryPoints
          ?.find(
            (entryPoint) =>
              entryPoint.entryPointType ===
              "video"
          )?.uri ||
        createdEvent?.hangoutLink ||
        null;

      if (!googleMeetLink) {
        console.warn(
          "⚠️ Google Calendar event was created, but no Google Meet link was returned."
        );
      }
    }

    // ====================================
    // RESULT
    // ====================================

    console.log(
      "✅ Google Calendar event created:",
      createdEvent.id
    );

    if (googleMeetLink) {
      console.log(
        "🔗 Google Meet:",
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
    };
  };

// ========================================
// DELETE CALENDAR EVENT
// ========================================

const deleteCalendarEvent =
  async (
    calendarEventId
  ) => {
    if (!calendarEventId) {
      console.log(
        "ℹ️ No Google Calendar event ID supplied. Nothing to delete."
      );

      return {
        success: true,
        deleted: false,
      };
    }

    try {
      console.log(
        `🗑️ Deleting Google Calendar event: ${calendarEventId}`
      );

      const auth =
        await getAuthorizedClient();

      if (!auth) {
        throw new Error(
          "Unable to authorize Google Calendar."
        );
      }

      const calendar =
        google.calendar({
          version: "v3",
          auth,
        });

      await calendar.events.delete(
        {
          calendarId:
            CALENDAR_ID,

          eventId:
            calendarEventId,

          sendUpdates: "all",
        }
      );

      console.log(
        "✅ Google Calendar event deleted."
      );

      return {
        success: true,
        deleted: true,
      };
    } catch (error) {
      // ----------------------------------
      // Google returns 404 if event already
      // does not exist.
      // ----------------------------------

      if (
        error?.code === 404 ||
        error?.response?.status ===
          404
      ) {
        console.warn(
          "⚠️ Google Calendar event no longer exists."
        );

        return {
          success: true,
          deleted: false,
          alreadyDeleted: true,
        };
      }

      console.error(
        "❌ Failed to delete Google Calendar event:",
        error
      );

      throw new Error(
        error?.message ||
          "Failed to delete Google Calendar event."
      );
    }
  };

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createCalendarEvent,
  deleteCalendarEvent,
};