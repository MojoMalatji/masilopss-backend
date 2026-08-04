const transporter = require("../config/mailer");

const sendEmail = async ({ to, subject, html, replyTo }) => {
  return transporter.sendMail({
    from: `"Mashilo Psyché & Social Solutions" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    replyTo,
  });
};

module.exports = {
  sendEmail,
};