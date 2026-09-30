const blockerService = require("../services/blockerService");

// ----------------------------------------
// Create Blocker
// ----------------------------------------

const createBlocker = async (
  req,
  res
) => {
  try {
    const {
      counselorId,
      counselorName,
      date,
      startTime,
      endTime,
      reason,
      createdBy,
    } = req.body;

    const blocker =
      await blockerService.createBlocker({
        counselorId,
        counselorName,
        date,
        startTime,
        endTime,
        reason,
        createdBy,
      });

    res.status(201).json({
      success: true,
      message:
        "Counselor availability blocked successfully.",
      blocker,
    });
  } catch (error) {
    console.error(
      "Create Blocker Error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to create blocker.",
    });
  }
};

// ----------------------------------------
// Get All Blockers
// ----------------------------------------

const getBlockers = async (
  req,
  res
) => {
  try {
    const blockers =
      await blockerService.getBlockers();

    res.status(200).json({
      success: true,
      blockers,
    });
  } catch (error) {
    console.error(
      "Get Blockers Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch blockers.",
      error: error.message,
    });
  }
};

// ----------------------------------------
// Get Counselor Blockers
// ----------------------------------------

const getCounselorBlockers = async (
  req,
  res
) => {
  try {
    const {
      counselorId,
    } = req.params;

    const blockers =
      await blockerService.getCounselorBlockers(
        counselorId
      );

    res.status(200).json({
      success: true,
      blockers,
    });
  } catch (error) {
    console.error(
      "Get Counselor Blockers Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch counselor blockers.",
      error: error.message,
    });
  }
};

// ----------------------------------------
// Delete Blocker
// ----------------------------------------

const deleteBlocker = async (
  req,
  res
) => {
  try {
    const {
      blockerId,
    } = req.body;

    const result =
      await blockerService.deleteBlocker(
        blockerId
      );

    res.status(200).json({
      success: true,
      message:
        "Counselor blocker removed successfully.",
      result,
    });
  } catch (error) {
    console.error(
      "Delete Blocker Error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to delete blocker.",
    });
  }
};

module.exports = {
  createBlocker,
  getBlockers,
  getCounselorBlockers,
  deleteBlocker,
};