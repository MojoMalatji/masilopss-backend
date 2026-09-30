// routes/blockerRoutes.js

const express = require("express");

const router = express.Router();

const {
  createBlocker,
  getBlockers,
  getCounselorBlockers,
  deleteBlocker,
} = require("../controllers/blockerController");

// ----------------------------------------
// Create blocker
// ----------------------------------------

router.post(
  "/createBlocker",
  createBlocker
);

// ----------------------------------------
// Get all blockers
// ----------------------------------------

router.get(
  "/blockers",
  getBlockers
);

// ----------------------------------------
// Get blockers for counselor
// ----------------------------------------

router.get(
  "/blockers/counselor/:counselorId",
  getCounselorBlockers
);

// ----------------------------------------
// Delete blocker
// ----------------------------------------

router.post(
  "/deleteBlocker",
  deleteBlocker
);

module.exports = router;