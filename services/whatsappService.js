const axios = require("axios");

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0";

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_TEMPLATE_LANGUAGE =
  process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

const validateWhatsAppConfig = () => {
  if (!WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID is not configured."
    );
  }

  if (!WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_ACCESS_TOKEN is not configured."
    );
  }
};

const createWhatsAppUrl = () => {
  return (
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/` +
    `${WHATSAPP_PHONE_NUMBER_ID}/messages`
  );
};

/**
 * Send a normal WhatsApp text message.
 *
 * Kept for existing functionality.
 */
const sendWhatsAppMessage = async ({
  to,
  message,
}) => {
  validateWhatsAppConfig();

  if (!to) {
    throw new Error(
      "WhatsApp recipient phone number is required."
    );
  }

  if (!message) {
    throw new Error(
      "WhatsApp message is required."
    );
  }

  const response = await axios.post(
    createWhatsAppUrl(),
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/**
 * Send an approved WhatsApp message template.
 *
 * Example:
 *
 * templateName:
 * appointment_reminder_30min
 *
 * variables:
 * [
 *   "Pride Mashilo",
 *   "John Doe",
 *   "2 October 2026",
 *   "15:30",
 *   "Counseling",
 *   "Pretoria"
 * ]
 */
const sendWhatsAppTemplateMessage = async ({
  to,
  templateName,
  variables = [],
  languageCode = WHATSAPP_TEMPLATE_LANGUAGE,
}) => {
  validateWhatsAppConfig();

  if (!to) {
    throw new Error(
      "WhatsApp recipient phone number is required."
    );
  }

  if (!templateName) {
    throw new Error(
      "WhatsApp template name is required."
    );
  }

  const parameters = variables.map(
    (value) => ({
      type: "text",
      text: String(value ?? ""),
    })
  );

  const response = await axios.post(
    createWhatsAppUrl(),
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components: [
          {
            type: "body",
            parameters,
          },
        ],
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
};