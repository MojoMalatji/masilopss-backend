// whatsappReminderRunner.js

require("dotenv").config();

const {
  processDueWhatsAppReminders,
} = require("./services/whatsappReminderService");

const CHECK_INTERVAL_MS = 60 * 1000; // Check every 1 minute

let isRunning = false;

const run = async () => {
  if (isRunning) {
    console.log(
      "⏳ WhatsApp reminder check already running. Skipping this cycle."
    );
    return;
  }

  isRunning = true;

  try {
    console.log("========================================");
    console.log("📲 WhatsApp Reminder Scheduler Started");
    console.log(
      `🕐 Running reminder check at: ${new Date().toISOString()}`
    );

    await processDueWhatsAppReminders();

    console.log("✅ WhatsApp reminder check finished.");
    console.log("========================================");
  } catch (error) {
    console.error(
      "❌ WhatsApp reminder scheduler error:",
      error
    );
  } finally {
    isRunning = false;
  }
};

// Run immediately when the backend starts
run();

// Continue checking every minute
setInterval(run, CHECK_INTERVAL_MS);

module.exports = {
  run,
};