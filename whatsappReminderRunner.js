// whatsappReminderRunner.js

require("dotenv").config();

const {
  processDueWhatsAppReminders,
} = require("./services/whatsappReminderService");

const run = async () => {
  console.log("========================================");
  console.log("📲 WhatsApp Reminder Scheduler Started");
  console.log(`🕐 Server time: ${new Date().toISOString()}`);
  console.log("========================================");

  try {
    const result =
      await processDueWhatsAppReminders();

    console.log("========================================");
    console.log("✅ WhatsApp Reminder Scheduler Completed");
    console.log(
      `📋 Bookings checked: ${result?.totalBookings || 0}`
    );
    console.log(
      `📤 Reminders sent: ${result?.sentCount || 0}`
    );
    console.log(
      `❌ Reminders failed: ${result?.failedCount || 0}`
    );
    console.log("========================================");

    process.exit(0);
  } catch (error) {
    console.error("========================================");
    console.error("❌ WhatsApp Reminder Scheduler Failed");
    console.error(error);
    console.error("========================================");

    process.exit(1);
  }
};

run();