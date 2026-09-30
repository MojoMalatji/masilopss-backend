const { sendEmail } = require("./emailService");

const clientTemplate = require("../templates/clientConfirmation");
const ownerTemplate = require("../templates/ownerNotification");

const clientApprovalTemplate = require("../templates/clientApproval");
const counselorAppointmentTemplate = require("../templates/counselorAppointment");

const clientRejectionTemplate = require("../templates/clientRejection");
const counselorRejectionTemplate = require("../templates/counselorRejection");

/**
 * Initial website booking notifications
 */
const sendBookingNotifications = async (booking) => {
  const results = {
    clientEmail: false,
    ownerEmail: false,
  };

  try {
    await sendEmail({
      to: booking.email,

      subject:
        "Booking Confirmation - Mashilo Psyché & Social Solutions",

      html: clientTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientEmail = true;

    console.log(
      `✅ Booking confirmation sent to ${booking.email}`
    );
  } catch (error) {
    console.error(
      "❌ Client booking email failed:",
      error.message
    );
  }

  try {
    await sendEmail({
      to: process.env.OWNER_EMAIL,

      subject: "New Booking Received",

      html: ownerTemplate(booking),

      replyTo: booking.email,
    });

    results.ownerEmail = true;

    console.log(
      `✅ Owner notification sent to ${process.env.OWNER_EMAIL}`
    );
  } catch (error) {
    console.error(
      "❌ Owner notification failed:",
      error.message
    );
  }

  return results;
};

/**
 * Approval emails
 */
const sendApprovalNotifications = async (booking) => {
  const results = {
    clientApprovalEmail: false,
    counselorEmail: false,
  };

  /*
   * Client
   */
  try {
    if (!booking.email) {
      throw new Error(
        "Client email is missing."
      );
    }

    await sendEmail({
      to: booking.email,

      subject:
        "Appointment Approved - Mashilo Psyché & Social Solutions",

      html: clientApprovalTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientApprovalEmail = true;

    console.log(
      `✅ Approval email sent to client: ${booking.email}`
    );
  } catch (error) {
    console.error(
      "❌ Client approval email failed:",
      error.message
    );
  }

  /*
   * Counselor
   */
  try {
    if (!booking.counselorEmail) {
      throw new Error(
        "Counselor email is missing."
      );
    }

    await sendEmail({
      to: booking.counselorEmail,

      subject:
        `Appointment Assigned - ${booking.date} at ${booking.time}`,

      html: counselorAppointmentTemplate(
        booking
      ),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.counselorEmail = true;

    console.log(
      `✅ Appointment email sent to counselor: ${booking.counselorEmail}`
    );
  } catch (error) {
    console.error(
      "❌ Counselor appointment email failed:",
      error.message
    );
  }

  return results;
};

/**
 * Rejection emails
 */
const sendRejectionNotifications = async (booking) => {
  const results = {
    clientRejectionEmail: false,
    counselorRejectionEmail: false,
  };

  /*
   * Client rejection email
   */
  try {
    if (!booking.email) {
      throw new Error(
        "Client email is missing."
      );
    }

    await sendEmail({
      to: booking.email,

      subject:
        "Appointment Request Update - Mashilo Psyché & Social Solutions",

      html: clientRejectionTemplate(booking),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.clientRejectionEmail = true;

    console.log(
      `✅ Rejection email sent to client: ${booking.email}`
    );
  } catch (error) {
    console.error(
      "❌ Client rejection email failed:",
      error.message
    );
  }

  /*
   * Counselor rejection email
   *
   * This is only sent if a counselor
   * was assigned to the booking.
   */
  try {
    if (!booking.counselorEmail) {
      console.log(
        "ℹ️ No counselor email assigned. Skipping counselor rejection email."
      );

      return results;
    }

    await sendEmail({
      to: booking.counselorEmail,

      subject:
        `Appointment Request Rejected - ${booking.date} at ${booking.time}`,

      html: counselorRejectionTemplate(
        booking
      ),

      replyTo: process.env.OWNER_EMAIL,
    });

    results.counselorRejectionEmail =
      true;

    console.log(
      `✅ Rejection email sent to counselor: ${booking.counselorEmail}`
    );
  } catch (error) {
    console.error(
      "❌ Counselor rejection email failed:",
      error.message
    );
  }

  return results;
};

module.exports = {
  sendBookingNotifications,
  sendApprovalNotifications,
  sendRejectionNotifications,
};