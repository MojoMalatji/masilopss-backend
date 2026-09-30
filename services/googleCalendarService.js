const { google } = require("googleapis");

const {
  getAuthorizedClient,
} = require("../config/googleAuth");

// ----------------------------------------
// Constants
// ----------------------------------------

const TIME_ZONE = "Africa/Johannesburg";
const APPOINTMENT_DURATION_MINUTES = 60;

// ----------------------------------------
// Helpers
// ----------------------------------------

const validateDate = (date) => {
  if (!date) {
    throw new Error("Appointment date is required.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(
      "Invalid appointment date. Expected YYYY-MM-DD."
    );
  }
};

const validateTime = (time) => {
  if (!time) {
    throw new Error("Appointment time is required.");
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(
      "Invalid appointment time. Expected HH:MM."
    );
  }

  const [hours, minutes] = time
    .split(":")
    .map(Number);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error("Invalid appointment time.");
  }
};

const getDateTime = (date, time) => {
  validateDate(date);
  validateTime(time);

  return `${date}T${time}:00`;
};

/**
 * Add minutes to an appointment time.
 *
 * This works with the local Africa/Johannesburg
 * appointment time and does not rely on the
 * server's timezone.
 */
const addMinutesToDateTime = (
  date,
  time,
  minutes
) => {
  validateDate(date);
  validateTime(time);

  const [hours, mins] = time
    .split(":")
    .map(Number);

  let totalMinutes =
    hours * 60 +
    mins +
    minutes;

  let daysToAdd = 0;

  while (totalMinutes >= 1440) {
    totalMinutes -= 1440;
    daysToAdd += 1;
  }

  while (totalMinutes < 0) {
    totalMinutes += 1440;
    daysToAdd -= 1;
  }

  const endHours = Math.floor(
    totalMinutes / 60
  );

  const endMinutes =
    totalMinutes % 60;

  let endDate = date;

  if (daysToAdd !== 0) {
    const dateObject = new Date(
      `${date}T00:00:00Z`
    );

    dateObject.setUTCDate(
      dateObject.getUTCDate() +
        daysToAdd
    );

    endDate = dateObject
      .toISOString()
      .split("T")[0];
  }

  return `${endDate}T${String(
    endHours
  ).padStart(2, "0")}:${String(
    endMinutes
  ).padStart(2, "0")}:00`;
};

/**
 * Determine whether the appointment
 * should have a Google Meet.
 */
const isOnlineConsultation = (
  booking
) => {
  const location =
    booking?.location
      ?.trim()
      .toLowerCase() || "";

  return (
    location.includes("online") ||
    location.includes("virtual") ||
    location.includes("remote")
  );
};

// ----------------------------------------
// Create Google Calendar Event
// ----------------------------------------

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
      "Booking date is required."
    );
  }

  if (!booking.time) {
    throw new Error(
      "Booking time is required."
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

  validateDate(booking.date);
  validateTime(booking.time);

  const auth =
    await getAuthorizedClient();

  const calendar =
    google.calendar({
      version: "v3",
      auth,
    });

  const online =
    isOnlineConsultation(booking);

  const startDateTime =
    getDateTime(
      booking.date,
      booking.time
    );

  const endDateTime =
    addMinutesToDateTime(
      booking.date,
      booking.time,
      APPOINTMENT_DURATION_MINUTES
    );

  // ----------------------------------------
  // Calendar attendees
  // ----------------------------------------

  const attendees = [
    {
      email: booking.email,
      displayName:
        booking.name || "Client",
    },
    {
      email: booking.counselorEmail,
      displayName:
        booking.counselorName ||
        "Counselor",
    },
  ];

  // ----------------------------------------
  // Base event
  // ----------------------------------------

  const event = {
    summary: `Mashilo PSS - ${
      booking.service ||
      "Consultation"
    }`,

    description: `
Mashilo Psyché & Social Solutions

Client:
${booking.name || "N/A"}

Client Email:
${booking.email}

Client Phone:
${booking.phone || "N/A"}

Counselor:
${booking.counselorName || "N/A"}

Counselor Email:
${booking.counselorEmail || "N/A"}

Service:
${booking.service || "N/A"}

Location:
${booking.location || "N/A"}

Additional Information:
${booking.info || "None"}

Booking ID:
${booking.id || "N/A"}
    `.trim(),

    start: {
      dateTime: startDateTime,
      timeZone: TIME_ZONE,
    },

    end: {
      dateTime: endDateTime,
      timeZone: TIME_ZONE,
    },

    attendees,

    reminders: {
      useDefault: true,
    },
  };

  // ----------------------------------------
  // In-person appointment
  // ----------------------------------------

  if (!online) {
    event.location =
      booking.location ||
      "Mashilo Psyché & Social Solutions";

    console.log(
      "📍 Appointment type: In-person"
    );
  }

  // ----------------------------------------
  // Online appointment
  // ----------------------------------------

  if (online) {
    console.log(
      "🎥 Appointment type: Online"
    );

    event.conferenceData = {
      createRequest: {
        requestId:
          `mashilo-${booking.id}-${Date.now()}`,

        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    };
  }

  // ----------------------------------------
  // Create event
  // ----------------------------------------

  console.log(
    `📅 Creating ${
      online
        ? "online"
        : "in-person"
    } Google Calendar event...`
  );

  const response =
    await calendar.events.insert({
      calendarId: "primary",

      resource: event,

      // Required by Google when creating
      // conference data / Google Meet.
      conferenceDataVersion:
        online ? 1 : 0,

      // Notify attendees.
      sendUpdates: "all",
    });

  const createdEvent =
    response.data;

  // ----------------------------------------
  // Get Google Meet link
  // ----------------------------------------

  let googleMeetLink = null;

  if (online) {
    const entryPoints =
      createdEvent
        .conferenceData
        ?.entryPoints || [];

    const videoEntry =
      entryPoints.find(
        (entry) =>
          entry.entryPointType ===
          "video"
      );

    googleMeetLink =
      videoEntry?.uri || null;

    if (googleMeetLink) {
      console.log(
        `🎥 Google Meet created: ${googleMeetLink}`
      );
    } else {
      console.warn(
        "⚠️ Calendar event was created, but Google Meet link was not returned."
      );
    }
  }

  console.log(
    `✅ Google Calendar event created: ${createdEvent.id}`
  );

  return {
    calendarEventId:
      createdEvent.id,

    calendarEventUrl:
      createdEvent.htmlLink || null,

    googleMeetLink,

    isOnline: online,
  };
};

// ----------------------------------------
// Delete Google Calendar Event
// ----------------------------------------

const deleteCalendarEvent = async (
  calendarEventId
) => {
  if (!calendarEventId) {
    console.log(
      "ℹ️ No Google Calendar event ID. Nothing to delete."
    );

    return {
      deleted: false,
      reason:
        "No calendar event ID.",
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
    console.log(
      `🗑️ Deleting Google Calendar event: ${calendarEventId}`
    );

    await calendar.events.delete({
      calendarId: "primary",

      eventId: calendarEventId,

      // Notify client and counselor
      // that the appointment was cancelled.
      sendUpdates: "all",
    });

    console.log(
      `✅ Google Calendar event deleted: ${calendarEventId}`
    );

    return {
      deleted: true,
      calendarEventId,
    };
  } catch (error) {
    // Google returns 404 if the event
    // no longer exists.
    if (error?.code === 404) {
      console.log(
        "ℹ️ Google Calendar event was already deleted."
      );

      return {
        deleted: true,
        calendarEventId,
        alreadyDeleted: true,
      };
    }

    console.error(
      "❌ Google Calendar event deletion failed:",
      error.message
    );

    throw error;
  }
};

// ----------------------------------------
// Exports
// ----------------------------------------

module.exports = {
  createCalendarEvent,
  deleteCalendarEvent,
};