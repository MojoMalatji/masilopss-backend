const { sendEmail } = require("./emailService");

const clientTemplate = require("../templates/clientConfirmation");
const ownerTemplate = require("../templates/ownerNotification");

const sendBookingNotifications = async (booking) => {

  // Client confirmation
  await sendEmail({
    to: booking.email,
    subject: "Booking Confirmation - Mashilo Psyché & Social Solutions",
    html: clientTemplate(booking),
    replyTo: process.env.OWNER_EMAIL,
  });

  // Owner notification
  await sendEmail({
    to: process.env.OWNER_EMAIL,
    subject: "New Booking Received",
    html: ownerTemplate(booking),
    replyTo: booking.email,
  });

};

module.exports = {
  sendBookingNotifications,
};