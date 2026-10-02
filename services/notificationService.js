const { sendEmail } = require("./emailService");

const clientTemplate = require("../templates/clientConfirmation");
const ownerTemplate = require("../templates/ownerNotification");

const clientApprovalTemplate = require("../templates/clientApproval");
const counselorAppointmentTemplate = require("../templates/counselorAppointment");

const clientRejectionTemplate = require("../templates/clientRejection");
const counselorRejectionTemplate = require("../templates/counselorRejection");

// Admin-created appointment templates
const adminAppointmentClient = require("../templates/adminAppointmentClient");
const adminAppointmentCounselor = require("../templates/adminAppointmentCounselor");

/**
 * ========================================
 * INITIAL WEBSITE BOOKING NOTIFICATIONS
 * ========================================
 */
const sendBookingNotifications = async (booking) => {
  const results = {
    clientEmail: false,
    ownerEmail: false,
  };

  /*
   * Client booking confirmation
   */
  try {
    await sendEmail({
      to: booking.email,

      subject: "Booking Confirmation - Mashilo Psyché & Social Solutions",

      html: clientTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientEmail = true;

    console.log(`✅ Booking confirmation sent to ${booking.email}`);
  } catch (error) {
    console.error("❌ Client booking email failed:", error.message);
  }

  /*
   * Owner notification
   */
  try {
    await sendEmail({
      to: process.env.OWNER_EMAIL,

      subject: "New Booking Received",

      html: ownerTemplate(booking),

      replyTo: booking.email,
    });

    results.ownerEmail = true;

    console.log(`✅ Owner notification sent to ${process.env.OWNER_EMAIL}`);
  } catch (error) {
    console.error("❌ Owner notification failed:", error.message);
  }

  return results;
};

/**
 * ========================================
 * PUBLIC BOOKING APPROVAL NOTIFICATIONS
 * ========================================
 *
 * Used when a client submits a booking
 * through the website and an admin approves it.
 */
const sendApprovalNotifications = async (booking) => {
  const results = {
    clientApprovalEmail: false,
    counselorEmail: false,
  };

  /*
   * Client approval email
   */
  try {
    if (!booking.email) {
      throw new Error("Client email is missing.");
    }

    await sendEmail({
      to: booking.email,

      subject: "Appointment Approved - Mashilo Psyché & Social Solutions",

      html: clientApprovalTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientApprovalEmail = true;

    console.log(`✅ Approval email sent to client: ${booking.email}`);
  } catch (error) {
    console.error("❌ Client approval email failed:", error.message);
  }

  /*
   * Counselor approval/assignment email
   */
  try {
    if (!booking.counselorEmail) {
      throw new Error("Counselor email is missing.");
    }

    await sendEmail({
      to: booking.counselorEmail,

      subject: `Appointment Assigned - ${booking.date} at ${booking.time}`,

      html: counselorAppointmentTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.counselorEmail = true;

    console.log(
      `✅ Appointment email sent to counselor: ${booking.counselorEmail}`,
    );
  } catch (error) {
    console.error("❌ Counselor appointment email failed:", error.message);
  }

  return results;
};

/**
 * ========================================
 * ADMIN APPOINTMENT NOTIFICATIONS
 * ========================================
 *
 * Used ONLY when an administrator creates
 * an appointment directly.
 *
 * Admin-created appointments are already
 * approved, therefore they must NOT use
 * the normal "Appointment Approved" emails.
 *
 * These emails use:
 *
 * Client:
 * "Appointment Scheduled"
 *
 * Counselor:
 * "Appointment Scheduled"
 */
const sendAdminAppointmentNotifications = async (booking) => {
  const results = {
    clientEmail: false,
    counselorEmail: false,
  };

  /*
   * ========================================
   * CLIENT APPOINTMENT SCHEDULED EMAIL
   * ========================================
   */
  try {
    if (!booking.email) {
      throw new Error("Client email is missing.");
    }

    await sendEmail({
      to: booking.email,

      subject: "Appointment Scheduled - Mashilo Psyché & Social Solutions",

      html: adminAppointmentClient(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientEmail = true;

    console.log(`✅ Admin appointment email sent to client: ${booking.email}`);
  } catch (error) {
    console.error("❌ Admin appointment client email failed:", error.message);
  }

  /*
   * ========================================
   * COUNSELOR APPOINTMENT SCHEDULED EMAIL
   * ========================================
   */
  try {
    if (!booking.counselorEmail) {
      throw new Error("Counselor email is missing.");
    }

    await sendEmail({
      to: booking.counselorEmail,

      subject: `Appointment Scheduled - ${booking.date} at ${booking.time}`,

      html: adminAppointmentCounselor(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.counselorEmail = true;

    console.log(
      `✅ Admin appointment email sent to counselor: ${booking.counselorEmail}`,
    );
  } catch (error) {
    console.error(
      "❌ Admin appointment counselor email failed:",
      error.message,
    );
  }

  return results;
};

/**
 * ========================================
 * REJECTION NOTIFICATIONS
 * ========================================
 */
const sendRejectionNotifications = async (booking) => {
  const results = {
    clientRejectionEmail: false,
    counselorRejectionEmail: false,
  };

  /*
   * ========================================
   * CLIENT REJECTION EMAIL
   * ========================================
   */
  try {
    if (!booking.email) {
      throw new Error("Client email is missing.");
    }

    await sendEmail({
      to: booking.email,

      subject: "Appointment Request Update - Mashilo Psyché & Social Solutions",

      html: clientRejectionTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientRejectionEmail = true;

    console.log(`✅ Rejection email sent to client: ${booking.email}`);
  } catch (error) {
    console.error("❌ Client rejection email failed:", error.message);
  }

  /*
   * ========================================
   * COUNSELOR REJECTION EMAIL
   * ========================================
   *
   * Only sent when a counselor has been
   * assigned to the booking.
   */
  try {
    if (!booking.counselorEmail) {
      console.log(
        "ℹ️ No counselor email assigned. Skipping counselor rejection email.",
      );

      return results;
    }

    await sendEmail({
      to: booking.counselorEmail,

      subject: `Appointment Request Rejected - ${booking.date} at ${booking.time}`,

      html: counselorRejectionTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.counselorRejectionEmail = true;

    console.log(
      `✅ Rejection email sent to counselor: ${booking.counselorEmail}`,
    );
  } catch (error) {
    console.error("❌ Counselor rejection email failed:", error.message);
  }

  return results;
};

/**
 * ========================================
 * EXPORTS
 * ========================================
 */
module.exports = {
  sendBookingNotifications,
  sendApprovalNotifications,
  sendAdminAppointmentNotifications,
  sendRejectionNotifications,
};
