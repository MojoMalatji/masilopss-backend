const axios = require("axios");

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v23.0";

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

  console.log(
  "🔐 WhatsApp token loaded:",
  WHATSAPP_ACCESS_TOKEN
    ? `YES (${WHATSAPP_ACCESS_TOKEN.length} characters)`
    : "NO"
);

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

  try {
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
  } catch (error) {
    console.error(
      "❌ WhatsApp text message API error"
    );

    console.error(
      "HTTP Status:",
      error?.response?.status || "Unknown"
    );

    console.error(
      "Meta Response:",
      JSON.stringify(
        error?.response?.data || {},
        null,
        2
      )
    );

    console.error(
      "Axios Error:",
      error?.message || "Unknown error"
    );

    throw error;
  }
};

/**
 * Send an approved WhatsApp template.
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

  const requestBody = {
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
  };

  console.log(
    "📤 Sending WhatsApp template..."
  );

  console.log(
    `📱 Recipient: ${to}`
  );

  console.log(
    `📄 Template: ${templateName}`
  );

  console.log(
    `🌍 Language: ${languageCode}`
  );

  console.log(
    `🔢 Parameters: ${parameters.length}`
  );

  try {
    const response = await axios.post(
      createWhatsAppUrl(),
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "✅ WhatsApp API request successful"
    );

    console.log(
      "📨 Meta Response:",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );

    return response.data;
  } catch (error) {
    console.error(
      "========================================"
    );

    console.error(
      "❌ META WHATSAPP API ERROR"
    );

    console.error(
      "========================================"
    );

    console.error(
      "HTTP Status:",
      error?.response?.status ||
        "Unknown"
    );

    console.error(
      "Meta Response:",
      JSON.stringify(
        error?.response?.data || {},
        null,
        2
      )
    );

    console.error(
      "Error Message:",
      error?.message ||
        "Unknown error"
    );

    console.error(
      "========================================"
    );

    throw error;
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
};