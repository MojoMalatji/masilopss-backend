// controllers/emailController.js

const { sendEmail } = require("../services/emailService");

const sendEmailController = async (req, res) => {
  try {
    const {
      subject,
      message,
      to,
    } = req.body;

    // ========================================
    // VALIDATION
    // ========================================

    if (!subject) {
      return res.status(400).json({
        success: false,
        error: "Email subject is required.",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Email message is required.",
      });
    }

    // ========================================
    // RECIPIENT
    // ========================================

    const recipient =
      to ||
      process.env.OWNER_EMAIL;

    if (!recipient) {
      return res.status(500).json({
        success: false,
        error:
          "No email recipient has been configured.",
      });
    }

    // ========================================
    // SEND EMAIL THROUGH RESEND
    // ========================================

    await sendEmail({
      to: recipient,

      subject,

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          "
        >
          <h2
            style="
              color: #35005f;
              margin-bottom: 20px;
            "
          >
            Mashilo Psyché & Social Solutions
          </h2>

          <div
            style="
              white-space: pre-wrap;
            "
          >
            ${message}
          </div>
        </div>
      `,

      replyTo:
        process.env.OWNER_EMAIL,
    });

    // ========================================
    // SUCCESS
    // ========================================

    console.log(
      `✅ Email sent successfully to ${recipient}`
    );

    return res.status(200).json({
      success: true,
      message: "Email sent successfully.",
    });
  } catch (error) {
    console.error(
      "❌ Email Controller Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Failed to send email.",
    });
  }
};

module.exports = {
  sendEmail: sendEmailController,
};