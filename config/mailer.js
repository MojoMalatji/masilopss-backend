// services/mailer.js

require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",

  // Use 587 instead of Gmail's 465 connection
  port: Number(process.env.SMTP_PORT || 587),

  // Port 587 uses STARTTLS
  secure: false,

  requireTLS: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// ========================================
// VERIFY MAIL SERVER
// ========================================

transporter.verify((error) => {
  if (error) {
    console.error(
      "❌ Mailer Error:",
      error.message
    );
  } else {
    console.log(
      "✅ Mail server ready"
    );
  }
});

module.exports = transporter;