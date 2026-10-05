// whatsappReminderTimingTest.js

const {
  buildTemplateVariables,
} = require("./services/whatsappReminderService");

const appointmentTime = new Date(
  "2026-10-02T16:00:00+02:00"
);

const now = new Date(
  "2026-10-02T15:50:00+02:00"
);

const thirtyMinuteReminder = new Date(
  appointmentTime.getTime() -
    30 * 60 * 1000
);

const tenMinuteReminder = new Date(
  appointmentTime.getTime() -
    10 * 60 * 1000
);

console.log(
  "========================================"
);

console.log(
  "🧪 WHATSAPP REMINDER TIMING TEST"
);

console.log(
  "========================================"
);

console.log("");

console.log(
  `📅 Appointment: ${appointmentTime.toISOString()}`
);

console.log(
  `🕐 Simulated current time: ${now.toISOString()}`
);

console.log("");

console.log(
  `⏰ 30-minute reminder: ${thirtyMinuteReminder.toISOString()}`
);

console.log(
  `⏰ 10-minute reminder: ${tenMinuteReminder.toISOString()}`
);

console.log("");

/**
 * Test 30-minute reminder.
 */
if (
  now.getTime() >=
    thirtyMinuteReminder.getTime() &&
  now.getTime() <
    appointmentTime.getTime()
) {
  console.log(
    "✅ 30-minute reminder is DUE."
  );
} else {
  console.log(
    "❌ 30-minute reminder is NOT due."
  );
}

/**
 * Test 10-minute reminder.
 */
if (
  now.getTime() >=
    tenMinuteReminder.getTime() &&
  now.getTime() <
    appointmentTime.getTime()
) {
  console.log(
    "✅ 10-minute reminder is DUE."
  );
} else {
  console.log(
    "ℹ️ 10-minute reminder is NOT due yet."
  );
}

console.log("");

console.log(
  "========================================"
);

console.log(
  "✅ TIMING TEST COMPLETED"
);

console.log(
  "========================================"
);

console.log("");

console.log(
  "⚠️ No WhatsApp message was sent."
);

console.log(
  "⚠️ No Firestore data was changed."
);