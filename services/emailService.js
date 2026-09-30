// services/emailService.js

require("dotenv").config();

const { Resend } = require("resend");

// ========================================
// RESEND
// ========================================

const resend = new Resend(
  process.env.RESEND_API_KEY
);

// ========================================
// SEND EMAIL
// ========================================

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
}) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is not configured."
    );
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }

  if (!to) {
    throw new Error(
      "Recipient email address is required."
    );
  }

  if (!subject) {
    throw new Error(
      "Email subject is required."
    );
  }

  if (!html) {
    throw new Error(
      "Email HTML content is required."
    );
  }

  const emailData = {
    from: process.env.EMAIL_FROM,
    to: [to],
    subject,
    html,
  };

  // Only include replyTo when supplied
  if (replyTo) {
    emailData.replyTo = replyTo;
  }

  const { data, error } =
    await resend.emails.send(emailData);

  if (error) {
    console.error(
      "❌ Resend email error:",
      error
    );

    throw new Error(
      error.message ||
        "Failed to send email."
    );
  }

  console.log(
    `✅ Email sent successfully. Resend ID: ${data?.id || "unknown"}`
  );

  return data;
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  sendEmail,
};