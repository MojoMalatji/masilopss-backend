// services/emailService.js

require("dotenv").config();

const { Resend } = require("resend");

// ========================================
// SEND EMAIL
// ========================================

const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
}) => {
  // ======================================
  // Validate environment
  // ======================================

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

  // ======================================
  // Validate email data
  // ======================================

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

  // ======================================
  // Initialize Resend
  // ======================================

  const resend = new Resend(
    process.env.RESEND_API_KEY
  );

  // ======================================
  // Prepare email
  // ======================================

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

  // ======================================
  // Send email
  // ======================================

  try {
    const { data, error } =
      await resend.emails.send(
        emailData
      );

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
      `✅ Email sent successfully. Resend ID: ${
        data?.id || "unknown"
      }`
    );

    return data;
  } catch (error) {
    console.error(
      "❌ Email sending failed:",
      error
    );

    throw new Error(
      error?.message ||
        "Failed to send email."
    );
  }
};

// ========================================
// EXPORT
// ========================================

module.exports = {
  sendEmail,
};