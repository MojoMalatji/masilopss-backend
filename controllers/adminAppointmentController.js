// controllers/adminAppointmentController.js

const {
  createAdminAppointment,
} = require("../services/adminAppointmentService");

/**
 * CREATE ADMIN APPOINTMENT
 */
const createAppointment = async (req, res) => {
  try {
    const result = await createAdminAppointment(
      req.body
    );

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "❌ Admin appointment creation error:",
      error
    );

    return res.status(400).json({
      success: false,
      error:
        error?.message ||
        "Failed to create appointment.",
    });
  }
};

module.exports = {
  createAppointment,
};