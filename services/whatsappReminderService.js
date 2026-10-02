// services/whatsappReminderService.js

const firestoreService = require("./firestoreService");

const {
  sendWhatsAppTemplateMessage,
} = require("./whatsappService");

/**
 * ========================================
 * CONFIGURATION
 * ========================================
 */

const TIME_ZONE = "Africa/Johannesburg";

/**
 * Meta WhatsApp template names.
 *
 * These MUST match the template names
 * created in Meta exactly.
 */
const WHATSAPP_TEMPLATES = {
  thirtyMinute:
    process.env.WHATSAPP_TEMPLATE_30MIN ||
    "appointment_reminder_30min",

  tenMinute:
    process.env.WHATSAPP_TEMPLATE_10MIN ||
    "appointment_reminder_10min",
};

/**
 * Counselor WhatsApp numbers.
 *
 * These should be stored in Render
 * environment variables.
 */
const COUNSELOR_WHATSAPP_NUMBERS = {
  "pride-mashilo":
    process.env.WHATSAPP_PRIDE_PHONE || "",

  mfanelo:
    process.env.WHATSAPP_MFANELO_PHONE || "",
};

/**
 * ========================================
 * HELPERS
 * ========================================
 */

/**
 * Convert appointment date/time in
 * South African time into a UTC Date.
 */
const createAppointmentDateTime = (
  date,
  time
) => {
  if (!date || !time) {
    throw new Error(
      "Appointment date and time are required."
    );
  }

  const dateTime = new Date(
    `${date}T${time}:00+02:00`
  );

  if (Number.isNaN(dateTime.getTime())) {
    throw new Error(
      "Invalid appointment date or time."
    );
  }

  return dateTime;
};

/**
 * ========================================
 * GET COUNSELOR WHATSAPP NUMBER
 * ========================================
 */

const getCounselorWhatsAppNumber = (
  booking
) => {
  if (!booking?.counselorId) {
    return "";
  }

  return (
    COUNSELOR_WHATSAPP_NUMBERS[
      booking.counselorId
    ] || ""
  );
};

/**
 * ========================================
 * FORMAT DATE
 * ========================================
 */

const formatAppointmentDate = (
  date
) => {
  if (!date) {
    return "";
  }

  const appointmentDate =
    new Date(
      `${date}T12:00:00+02:00`
    );

  if (
    Number.isNaN(
      appointmentDate.getTime()
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    "en-ZA",
    {
      timeZone: TIME_ZONE,
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(appointmentDate);
};

/**
 * ========================================
 * FORMAT TIME
 * ========================================
 */

const formatAppointmentTime = (
  date,
  time
) => {
  try {
    const appointmentDateTime =
      createAppointmentDateTime(
        date,
        time
      );

    return new Intl.DateTimeFormat(
      "en-ZA",
      {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).format(
      appointmentDateTime
    );
  } catch (error) {
    return time || "";
  }
};

/**
 * ========================================
 * GET TEMPLATE NAME
 * ========================================
 */

const getTemplateName = (
  reminderType
) => {
  if (
    reminderType ===
    "thirtyMinute"
  ) {
    return WHATSAPP_TEMPLATES.thirtyMinute;
  }

  if (
    reminderType ===
    "tenMinute"
  ) {
    return WHATSAPP_TEMPLATES.tenMinute;
  }

  throw new Error(
    `Unknown reminder type: ${reminderType}`
  );
};

/**
 * ========================================
 * BUILD TEMPLATE VARIABLES
 * ========================================
 *
 * These correspond to the Meta template:
 *
 * {{1}} = Counselor name
 * {{2}} = Client name
 * {{3}} = Appointment date
 * {{4}} = Appointment time
 * {{5}} = Service
 * {{6}} = Location
 */

const buildTemplateVariables = (
  booking
) => {
  const counselorName =
    booking.counselorName ||
    "Counselor";

  const clientName =
    booking.name ||
    "Client";

  const appointmentDate =
    formatAppointmentDate(
      booking.date
    );

  const appointmentTime =
    formatAppointmentTime(
      booking.date,
      booking.time
    );

  const service =
    booking.service ||
    "Appointment";

  const location =
    booking.location ||
    "Not specified";

  return [
    counselorName,
    clientName,
    appointmentDate,
    appointmentTime,
    service,
    location,
  ];
};

/**
 * ========================================
 * CALCULATE REMINDER TIME
 * ========================================
 */

const calculateReminderTime = (
  appointmentDateTime,
  minutesBefore
) => {
  return new Date(
    appointmentDateTime.getTime() -
      minutesBefore * 60 * 1000
  );
};

/**
 * ========================================
 * GET REMINDER CONFIGURATION
 * ========================================
 */

const getReminderConfiguration = (
  reminderType,
  appointmentDateTime
) => {
  if (
    reminderType ===
    "thirtyMinute"
  ) {
    return {
      minutesBefore: 30,

      scheduledFor:
        calculateReminderTime(
          appointmentDateTime,
          30
        ),
    };
  }

  if (
    reminderType ===
    "tenMinute"
  ) {
    return {
      minutesBefore: 10,

      scheduledFor:
        calculateReminderTime(
          appointmentDateTime,
          10
        ),
    };
  }

  throw new Error(
    `Unknown reminder type: ${reminderType}`
  );
};

/**
 * ========================================
 * PROCESS ONE REMINDER
 * ========================================
 */

const processReminder = async ({
  booking,
  reminderType,
}) => {
  if (!booking?.id) {
    return {
      processed: false,
      reason:
        "Booking ID is missing.",
    };
  }

  /**
   * Only approved appointments
   * receive reminders.
   */
  if (
    booking.status !==
    "approved"
  ) {
    return {
      processed: false,
      reason:
        `Booking status is ${booking.status}.`,
    };
  }

  /**
   * Create appointment Date object.
   */
  let appointmentDateTime;

  try {
    appointmentDateTime =
      createAppointmentDateTime(
        booking.date,
        booking.time
      );
  } catch (error) {
    console.error(
      `❌ Invalid appointment date/time for booking ${booking.id}:`,
      error.message
    );

    return {
      processed: false,
      reason: error.message,
    };
  }

  /**
   * Get reminder configuration.
   */
  const {
    minutesBefore,
    scheduledFor,
  } =
    getReminderConfiguration(
      reminderType,
      appointmentDateTime
    );

  /**
   * Get current Firestore
   * reminder state.
   */
  const reminders =
    booking.whatsappReminders ||
    {};

  const reminder =
    reminders[reminderType] ||
    {};

  /**
   * Never send the same reminder
   * twice.
   */
  if (reminder.sent === true) {
    return {
      processed: false,
      alreadySent: true,
      bookingId: booking.id,
      reminderType,
    };
  }

  /**
   * Save scheduled time.
   */
  if (
    !reminder.scheduledFor
  ) {
    try {
      await firestoreService.updateWhatsAppReminder(
        booking.id,
        reminderType,
        {
          scheduledFor:
            scheduledFor.toISOString(),
        }
      );

      console.log(
        `🕐 ${reminderType} WhatsApp reminder scheduled for booking ${booking.id}: ${scheduledFor.toISOString()}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to save ${reminderType} reminder schedule:`,
        error
      );
    }
  }

  const now = new Date();

  /**
   * Not due yet.
   */
  if (
    now.getTime() <
    scheduledFor.getTime()
  ) {
    return {
      processed: false,
      notDue: true,
      bookingId: booking.id,
      reminderType,
      scheduledFor:
        scheduledFor.toISOString(),
    };
  }

  /**
   * Appointment already started.
   */
  if (
    now.getTime() >=
    appointmentDateTime.getTime()
  ) {
    return {
      processed: false,
      expired: true,
      bookingId: booking.id,
      reminderType,
    };
  }

  /**
   * Get counselor WhatsApp number.
   */
  const counselorPhone =
    getCounselorWhatsAppNumber(
      booking
    );

  if (!counselorPhone) {
    const errorMessage =
      `No WhatsApp number configured for counselor ${booking.counselorId}.`;

    console.error(
      `❌ ${errorMessage}`
    );

    try {
      await firestoreService.updateWhatsAppReminder(
        booking.id,
        reminderType,
        {
          attempts:
            (reminder.attempts || 0) +
            1,

          lastError:
            errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "❌ Failed to record WhatsApp reminder error:",
        updateError
      );
    }

    return {
      processed: false,
      failed: true,
      bookingId: booking.id,
      reminderType,
      reason: errorMessage,
    };
  }

  /**
   * Get the Meta template name.
   */
  const templateName =
    getTemplateName(
      reminderType
    );

  /**
   * Build the six template variables.
   */
  const variables =
    buildTemplateVariables(
      booking
    );

  console.log(
    `📲 Sending ${minutesBefore}-minute WhatsApp template reminder...`
  );

  console.log(
    `Booking: ${booking.id}`
  );

  console.log(
    `Counselor: ${booking.counselorName}`
  );

  console.log(
    `Template: ${templateName}`
  );

  /**
   * Send approved Meta template.
   */
  try {
    const response =
      await sendWhatsAppTemplateMessage(
        {
          to: counselorPhone,

          templateName,

          variables,
        }
      );

    /**
     * Mark reminder as sent.
     */
    await firestoreService.updateWhatsAppReminder(
      booking.id,
      reminderType,
      {
        sent: true,

        sentAt:
          new Date().toISOString(),

        attempts:
          (reminder.attempts || 0) +
          1,

        lastError: null,

        messageId:
          response?.messages?.[0]?.id ||
          null,
      }
    );

    console.log(
      `✅ ${minutesBefore}-minute WhatsApp reminder sent successfully for booking ${booking.id}`
    );

    return {
      processed: true,
      sent: true,
      bookingId: booking.id,
      reminderType,
      minutesBefore,
      templateName,
      response,
    };
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error
        ?.message ||
      error?.message ||
      "Unknown WhatsApp error.";

    console.error(
      `❌ Failed to send ${minutesBefore}-minute WhatsApp reminder:`,
      errorMessage
    );

    /**
     * Record failed attempt.
     *
     * sent remains false so the
     * scheduler can retry later.
     */
    try {
      await firestoreService.updateWhatsAppReminder(
        booking.id,
        reminderType,
        {
          sent: false,

          attempts:
            (reminder.attempts || 0) +
            1,

          lastError:
            errorMessage,
        }
      );
    } catch (updateError) {
      console.error(
        "❌ Failed to record WhatsApp error in Firestore:",
        updateError
      );
    }

    return {
      processed: false,
      sent: false,
      failed: true,
      bookingId: booking.id,
      reminderType,
      error: errorMessage,
    };
  }
};

/**
 * ========================================
 * PROCESS ALL DUE REMINDERS
 * ========================================
 */

const processDueWhatsAppReminders =
  async () => {
    console.log(
      "🔔 Checking WhatsApp appointment reminders..."
    );

    const bookings =
      await firestoreService.getApprovedBookings();

    console.log(
      `📋 Approved bookings found: ${bookings.length}`
    );

    const results = [];

    for (const booking of bookings) {
      /**
       * 30-minute reminder.
       */
      const thirtyMinuteResult =
        await processReminder({
          booking,
          reminderType:
            "thirtyMinute",
        });

      results.push(
        thirtyMinuteResult
      );

      /**
       * 10-minute reminder.
       */
      const tenMinuteResult =
        await processReminder({
          booking,
          reminderType:
            "tenMinute",
        });

      results.push(
        tenMinuteResult
      );
    }

    const sentCount =
      results.filter(
        (result) =>
          result.sent === true
      ).length;

    const failedCount =
      results.filter(
        (result) =>
          result.failed === true
      ).length;

    console.log(
      `📲 WhatsApp reminder check complete. Sent: ${sentCount}, Failed: ${failedCount}`
    );

    return {
      success: true,

      totalBookings:
        bookings.length,

      results,

      sentCount,

      failedCount,
    };
  };

/**
 * ========================================
 * EXPORTS
 * ========================================
 */

module.exports = {
  processDueWhatsAppReminders,
  processReminder,
  buildTemplateVariables,
};