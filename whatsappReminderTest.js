// whatsappReminderTest.js

require("dotenv").config();

const {
  buildTemplateVariables,
} = require("./services/whatsappReminderService");

const testBooking = {
  id: "TEST-BOOKING-001",

  status: "approved",

  name: "John Doe",

  email: "john@example.com",

  phone: "0780000000",

  date: "2026-10-02",

  time: "16:00",

  service: "Counseling",

  location: "Pretoria",

  counselorId: "pride-mashilo",

  counselorName: "Pride Mashilo",

  counselorEmail:
    "pride@mashilopss.co.za",

  googleMeetLink:
    "https://meet.google.com/test-link",

  whatsappReminders: {
    thirtyMinute: {
      scheduledFor: null,
      sent: false,
      sentAt: null,
      attempts: 0,
      lastError: null,
    },

    tenMinute: {
      scheduledFor: null,
      sent: false,
      sentAt: null,
      attempts: 0,
      lastError: null,
    },
  },
};

const runTest = () => {
  console.log(
    "========================================"
  );

  console.log(
    "🧪 WHATSAPP REMINDER LOCAL TEST"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log("📋 Test booking:");
  console.log(
    `Booking ID: ${testBooking.id}`
  );
  console.log(
    `Client: ${testBooking.name}`
  );
  console.log(
    `Counselor: ${testBooking.counselorName}`
  );
  console.log(
    `Appointment: ${testBooking.date} ${testBooking.time}`
  );
  console.log(
    `Service: ${testBooking.service}`
  );
  console.log(
    `Location: ${testBooking.location}`
  );

  console.log("");

  /**
   * Test template variables.
   */
  const variables =
    buildTemplateVariables(
      testBooking
    );

  console.log(
    "📨 Template variables:"
  );

  variables.forEach(
    (value, index) => {
      console.log(
        `{{${index + 1}}} = ${value}`
      );
    }
  );

  console.log("");

  /**
   * Test 30-minute template.
   */
  console.log(
    "⏰ 30-MINUTE TEMPLATE"
  );

  console.log(
    "Template name:"
  );

  console.log(
    "appointment_reminder_30min"
  );

  console.log("");

  /**
   * Test 10-minute template.
   */
  console.log(
    "⏰ 10-MINUTE TEMPLATE"
  );

  console.log(
    "Template name:"
  );

  console.log(
    "appointment_reminder_10min"
  );

  console.log("");

  console.log(
    "========================================"
  );

  console.log(
    "✅ LOCAL TEST COMPLETED"
  );

  console.log(
    "========================================"
  );

  console.log("");

  console.log(
    "⚠️ No WhatsApp message was sent."
  );

  console.log(
    "⚠️ Meta API was NOT called."
  );

  console.log(
    "⚠️ No Firestore booking was changed."
  );
};

runTest();