
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
 * These must be configured in the .env file.
 */
const COUNSELOR_WHATSAPP_NUMBERS = {
  "pride-mashilo":
    process.env.WHATSAPP_PRIDE_PHONE || "",

  mfanelo:
    process.env.WHATSAPP_MFANELO_PHONE || "",
};

/**
 * ========================================
 * CREATE APPOINTMENT DATE/TIME
 * ========================================
 */

const createAppointmentDateTime = (date, time) => {
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

const getCounselorWhatsAppNumber = (booking) => {
  if (!booking?.counselorId) {
    return "";
  }

  const rawNumber =
    COUNSELOR_WHATSAPP_NUMBERS[
      booking.counselorId
    ] || "";

  if (!rawNumber) {
    return "";
  }

  /**
   * Remove spaces, +, brackets, hyphens, etc.
   */
  let number = String(rawNumber).replace(/\D/g, "");

  /**
   * Convert South African local format:
   * 0821234567
   *
   * to:
   * 27821234567
   */
  if (number.startsWith("0")) {
    number = "27" + number.slice(1);
  }

  /**
   * Basic international WhatsApp number validation.
   */
  if (!/^\d{10,15}$/.test(number)) {
    console.error(
      `❌ Invalid WhatsApp number for counselor ${booking.counselorId}`
    );

    return "";
  }

  return number;
};

/**
 * ========================================
 * FORMAT APPOINTMENT DATE
 * ========================================
 */

const formatAppointmentDate = (date) => {
  if (!date) {
    return "";
  }

  const appointmentDate = new Date(
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
 * FORMAT APPOINTMENT TIME
 * ========================================
 */

const formatAppointmentTime = (date, time) => {
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
    ).format(appointmentDateTime);
  } catch (error) {
    return time || "";
  }
};

/**
 * ========================================
 * GET TEMPLATE NAME
 * ========================================
 */

const getTemplateName = (reminderType) => {
  if (reminderType === "thirtyMinute") {
    return WHATSAPP_TEMPLATES.thirtyMinute;
  }

  if (reminderType === "tenMinute") {
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
 * Template variables:
 *
 * {{1}} Counselor name
 * {{2}} Client name
 * {{3}} Appointment date
 * {{4}} Appointment time
 * {{5}} Service
 * {{6}} Location
 */

const buildTemplateVariables = (booking) => {
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
  if (reminderType === "thirtyMinute") {
    return {
      minutesBefore: 30,

      scheduledFor:
        calculateReminderTime(
          appointmentDateTime,
          30
        ),
    };
  }

  if (reminderType === "tenMinute") {
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
      reason: "Booking ID is missing.",
    };
  }

  /**
   * Only approved appointments
   * receive reminders.
   */
  if (booking.status !== "approved") {
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
      failed: true,
      bookingId: booking.id,
      reminderType,
      error: error.message,
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

  const now = new Date();

  /**
   * Get current Firestore reminder state.
   */
  const reminders =
    booking.whatsappReminders || {};

  const reminder =
    reminders[reminderType] || {};

  /**
   * Debug information.
   */
  console.log(
    `🕐 Current UTC time: ${now.toISOString()}`
  );

  console.log(
    `📅 Appointment UTC time: ${appointmentDateTime.toISOString()}`
  );

  console.log(
    `⏰ ${minutesBefore}-minute reminder due at: ${scheduledFor.toISOString()}`
  );

  console.log(
    `📊 Reminder already sent: ${reminder.sent === true}`
  );

  /**
   * Never send the same reminder twice.
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
  if (!reminder.scheduledFor) {
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

  /**
   * Not due yet.
   */
  if (
    now.getTime() <
    scheduledFor.getTime()
  ) {
    console.log(
      `⏳ ${reminderType} reminder is NOT due yet.`
    );

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
    console.log(
      `⌛ Appointment has already started.`
    );

    return {
      processed: false,
      expired: true,
      bookingId: booking.id,
      reminderType,
    };
  }

  /**
   * ========================================
   * GET COUNSELOR WHATSAPP NUMBER
   * ========================================
   */

  const counselorPhone =
    getCounselorWhatsAppNumber(
      booking
    );

  if (!counselorPhone) {
    const errorMessage =
      `No valid WhatsApp number configured for counselor ${booking.counselorId}.`;

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
      sent: false,
      failed: true,
      bookingId: booking.id,
      reminderType,
      error: errorMessage,
    };
  }

  /**
   * ========================================
   * GET TEMPLATE NAME
   * ========================================
   */

  const templateName =
    getTemplateName(
      reminderType
    );

  /**
   * ========================================
   * BUILD TEMPLATE VARIABLES
   * ========================================
   */

  const variables =
    buildTemplateVariables(
      booking
    );

  /**
   * ========================================
   * LOG SEND INFORMATION
   * ========================================
   */

  console.log(
    "========================================"
  );

  console.log(
    `📲 Sending ${minutesBefore}-minute WhatsApp reminder`
  );

  console.log(
    `Booking ID: ${booking.id}`
  );

  console.log(
    `Client: ${booking.name || "Unknown"}`
  );

  console.log(
    `Counselor: ${
      booking.counselorName ||
      "Unknown"
    }`
  );

  console.log(
    `Counselor ID: ${
      booking.counselorId ||
      "Missing"
    }`
  );

  console.log(
    `WhatsApp number: ${counselorPhone}`
  );

  console.log(
    `Template: ${templateName}`
  );

  console.log(
    `Language: ${
      process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
      "en_US"
    }`
  );

  console.log(
    `Variables: ${JSON.stringify(
      variables
    )}`
  );

  console.log(
    "========================================"
  );

  /**
   * ========================================
   * SEND WHATSAPP TEMPLATE
   * ========================================
   */

  try {
    const response =
      await sendWhatsAppTemplateMessage({
        to: counselorPhone,

        templateName,

        variables,
      });

    console.log(
      "✅ Meta WhatsApp API response received."
    );

    console.log(
      `📨 Message ID: ${
        response?.messages?.[0]?.id ||
        "not returned"
      }`
    );

    /**
     * ========================================
     * MARK REMINDER AS SENT
     * ========================================
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

    if (
      error?.response?.data?.error
    ) {
      console.error(
        "Meta API error:",
        JSON.stringify(
          error.response.data.error,
          null,
          2
        )
      );
    }

    /**
     * ========================================
     * RECORD FAILED ATTEMPT
     * ========================================
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
      console.log(
        "========================================"
      );

      console.log(
        `📌 Checking booking: ${booking.id}`
      );

      console.log(
        `👤 Client: ${
          booking.name || "Unknown"
        }`
      );

      console.log(
        `📅 Date: ${
          booking.date || "Missing"
        }`
      );

      console.log(
        `🕐 Time: ${
          booking.time || "Missing"
        }`
      );

      console.log(
        `📊 Status: ${
          booking.status || "Missing"
        }`
      );

      console.log(
        `👨‍⚕️ Counselor: ${
          booking.counselorName ||
          "Missing"
        }`
      );

      console.log(
        `🆔 Counselor ID: ${
          booking.counselorId ||
          "Missing"
        }`
      );

      console.log(
        `📱 Counselor WhatsApp number: ${
          getCounselorWhatsAppNumber(
            booking
          )
            ? "CONFIGURED"
            : "MISSING"
        }`
      );

      /**
       * ========================================
       * 30-MINUTE REMINDER
       * ========================================
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
       * ========================================
       * 10-MINUTE REMINDER
       * ========================================
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

      console.log(
        `30-minute result: ${JSON.stringify(
          thirtyMinuteResult
        )}`
      );

      console.log(
        `10-minute result: ${JSON.stringify(
          tenMinuteResult
        )}`
      );

      console.log(
        "========================================"
      );
    }

    /**
     * ========================================
     * RESULT COUNTS
     * ========================================
     */

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

    const notDueCount =
      results.filter(
        (result) =>
          result.notDue === true
      ).length;

    const expiredCount =
      results.filter(
        (result) =>
          result.expired === true
      ).length;

    const alreadySentCount =
      results.filter(
        (result) =>
          result.alreadySent === true
      ).length;

    console.log(
      "========================================"
    );

    console.log(
      "📲 WhatsApp reminder check complete."
    );

    console.log(
      `📋 Bookings checked: ${bookings.length}`
    );

    console.log(
      `📤 Reminders sent: ${sentCount}`
    );

    console.log(
      `❌ Reminders failed: ${failedCount}`
    );

    console.log(
      `⏳ Reminders not due: ${notDueCount}`
    );

    console.log(
      `⌛ Reminders expired: ${expiredCount}`
    );

    console.log(
      `✅ Already sent: ${alreadySentCount}`
    );

    console.log(
      "========================================"
    );

    return {
      success: true,

      totalBookings:
        bookings.length,

      results,

      sentCount,

      failedCount,

      notDueCount,

      expiredCount,

      alreadySentCount,
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