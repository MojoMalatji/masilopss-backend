// controllers/blockerController.js

const blockerService = require("../services/blockerService");

// ========================================
// CREATE BLOCKER
// ========================================

const createBlocker = async (req, res) => {
  try {
    const blocker = await blockerService.createBlocker(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Availability block created successfully.",
      blocker,
    });
  } catch (error) {
    console.error(
      "Error creating blocker:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      error:
        error.message ||
        "Failed to create availability block.",
    });
  }
};

// ========================================
// GET ALL BLOCKERS
// ========================================

const getBlockers = async (req, res) => {
  try {
    const blockers =
      await blockerService.getBlockers();

    return res.status(200).json({
      success: true,
      blockers,
    });
  } catch (error) {
    console.error(
      "Error loading blockers:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to load availability blocks.",
    });
  }
};

// ========================================
// GET COUNSELOR BLOCKERS
// ========================================

const getCounselorBlockers = async (
  req,
  res
) => {
  try {
    const { counselorId } = req.params;

    if (!counselorId) {
      return res.status(400).json({
        success: false,
        error: "Counselor ID is required.",
      });
    }

    const blockers =
      await blockerService.getCounselorBlockers(
        counselorId
      );

    return res.status(200).json({
      success: true,
      blockers,
    });
  } catch (error) {
    console.error(
      "Error loading counselor blockers:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to load counselor availability blocks.",
    });
  }
};

// ========================================
// DELETE BLOCKER
// ========================================

const deleteBlocker = async (req, res) => {
  try {
    const result =
      await blockerService.deleteBlocker(
        req.body
      );

    return res.status(200).json({
      success: true,
      message:
        "Availability block removed successfully.",
      ...result,
    });
  } catch (error) {
    console.error(
      "Error deleting blocker:",
      error
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      error:
        error.message ||
        "Failed to remove availability block.",
    });
  }
};

module.exports = {
  createBlocker,
  getBlockers,
  getCounselorBlockers,
  deleteBlocker,
};