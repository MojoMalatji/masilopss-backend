// routes/adminAppointmentRoutes.js

const express = require("express");

const {
  createAppointment,
} = require("../controllers/adminAppointmentController");

const router = express.Router();

/**
 * CREATE ADMIN APPOINTMENT
 *
 * POST /admin/createAppointment
 */
router.post(
  "/admin/createAppointment",
  createAppointment
);

module.exports = router;