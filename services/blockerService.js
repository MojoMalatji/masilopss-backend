// services/blockerService.js

const {
  Timestamp,
} = require("firebase-admin/firestore");

const db = require("../config/firebase");

const {
  createBlockerCalendarEvent,
  deleteBlockerCalendarEvent,
} = require("./googleCalendarBlockerService");

// ========================================
// CONFIGURATION
// ========================================

const BLOCKERS_COLLECTION = "blockers";

const INFO_EMAIL = "info@mashilopss.co.za";

const INFO_NAME =
  "Mashilo Psyché & Social Solutions";

const TIME_ZONE = "Africa/Johannesburg";

// ========================================
// GET TODAY IN SOUTH AFRICA
// ========================================

const getTodaySouthAfrica = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// ========================================
// VALIDATE DATE
// ========================================

const isValidDate = (date) => {
  if (!date || typeof date !== "string") {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(date);
};

// ========================================
// VALIDATE TIME
// ========================================

const isValidTime = (time) => {
  if (!time || typeof time !== "string") {
    return false;
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
};

// ========================================
// CONVERT TIME TO MINUTES
// ========================================

const timeToMinutes = (time) => {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
};

// ========================================
// CHECK COUNSELOR AVAILABILITY
// ========================================

const isCounselorAvailable = async ({
  counselorId,
  date,
  startTime,
  endTime,
}) => {
  if (
    !counselorId ||
    !date ||
    !startTime ||
    !endTime
  ) {
    return false;
  }

  if (
    !isValidDate(date) ||
    !isValidTime(startTime) ||
    !isValidTime(endTime)
  ) {
    return false;
  }

  const requestedStart =
    timeToMinutes(startTime);

  const requestedEnd =
    timeToMinutes(endTime);

  if (requestedEnd <= requestedStart) {
    return false;
  }

  // ----------------------------------------
  // GET BLOCKERS FOR COUNSELOR + DATE
  // ----------------------------------------

  const snapshot = await db
    .collection(BLOCKERS_COLLECTION)
    .where(
      "counselorId",
      "==",
      counselorId
    )
    .where(
      "date",
      "==",
      date
    )
    .get();

  // ----------------------------------------
  // CHECK FOR OVERLAPPING BLOCKER
  // ----------------------------------------

  const overlappingBlocker =
    snapshot.docs.find((doc) => {
      const blocker = doc.data();

      // Ignore deleted blockers
      if (blocker.status === "deleted") {
        return false;
      }

      if (
        !blocker.startTime ||
        !blocker.endTime
      ) {
        return false;
      }

      const blockerStart =
        timeToMinutes(
          blocker.startTime
        );

      const blockerEnd =
        timeToMinutes(
          blocker.endTime
        );

      return (
        requestedStart < blockerEnd &&
        requestedEnd > blockerStart
      );
    });

  // No blocker = counselor is available
  return !overlappingBlocker;
};

// ========================================
// CREATE BLOCKER
// ========================================

const createBlocker = async (data) => {
  const {
    counselorId,
    counselorName,
    counselorEmail,
    date,
    startTime,
    endTime,
    reason,
    createdBy,
  } = data || {};

  // ----------------------------------------
  // REQUIRED FIELDS
  // ----------------------------------------

  if (!counselorId) {
    const error = new Error(
      "Counselor is required."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!counselorName) {
    const error = new Error(
      "Counselor name is required."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!counselorEmail) {
    const error = new Error(
      "Counselor email is required."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!date) {
    const error = new Error(
      "Blocker date is required."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!startTime) {
    const error = new Error(
      "Blocker start time is required."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!endTime) {
    const error = new Error(
      "Blocker end time is required."
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------
  // VALIDATE DATE
  // ----------------------------------------

  if (!isValidDate(date)) {
    const error = new Error(
      "Invalid blocker date."
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------
  // PREVENT PAST DATES
  // ----------------------------------------

  const today =
    getTodaySouthAfrica();

  if (date < today) {
    const error = new Error(
      "You cannot create an availability block for a past date."
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------
  // VALIDATE TIMES
  // ----------------------------------------

  if (!isValidTime(startTime)) {
    const error = new Error(
      "Invalid blocker start time."
    );

    error.statusCode = 400;

    throw error;
  }

  if (!isValidTime(endTime)) {
    const error = new Error(
      "Invalid blocker end time."
    );

    error.statusCode = 400;

    throw error;
  }

  const startMinutes =
    timeToMinutes(startTime);

  const endMinutes =
    timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    const error = new Error(
      "Blocker end time must be later than the start time."
    );

    error.statusCode = 400;

    throw error;
  }

  // ========================================
  // CHECK EXISTING BLOCKERS
  // ========================================

  const existingSnapshot =
    await db
      .collection(BLOCKERS_COLLECTION)
      .where(
        "counselorId",
        "==",
        counselorId
      )
      .where(
        "date",
        "==",
        date
      )
      .get();

  const overlappingBlocker =
    existingSnapshot.docs.find(
      (doc) => {
        const existing =
          doc.data();

        if (
          existing.status ===
          "deleted"
        ) {
          return false;
        }

        if (
          !existing.startTime ||
          !existing.endTime
        ) {
          return false;
        }

        const existingStart =
          timeToMinutes(
            existing.startTime
          );

        const existingEnd =
          timeToMinutes(
            existing.endTime
          );

        return (
          startMinutes <
            existingEnd &&
          endMinutes >
            existingStart
        );
      }
    );

  if (overlappingBlocker) {
    const existing =
      overlappingBlocker.data();

    const error = new Error(
      `This counselor already has an availability block from ${existing.startTime} to ${existing.endTime} on ${date}.`
    );

    error.statusCode = 409;

    throw error;
  }

  // ========================================
  // CREATE FIRESTORE DOCUMENT
  // ========================================

  const blockerRef =
    db
      .collection(
        BLOCKERS_COLLECTION
      )
      .doc();

  const timestamp =
    Timestamp.now();

  const blocker = {
    counselorId,

    counselorName,

    counselorEmail,

    date,

    startTime,

    endTime,

    reason:
      reason?.trim() || "",

    createdBy:
      createdBy || INFO_NAME,

    createdAt: timestamp,

    updatedAt: timestamp,

    status: "active",

    googleCalendarEventId:
      null,

    googleCalendarEventUrl:
      null,
  };

  // ========================================
  // SAVE BLOCKER
  // ========================================

  await blockerRef.set(blocker);

  // ========================================
  // CREATE GOOGLE CALENDAR EVENT
  // ========================================

  try {
    console.log(
      "📅 Creating Google Calendar blocker..."
    );

    const calendarResult =
      await createBlockerCalendarEvent({
        id: blockerRef.id,

        counselorId,

        counselorName,

        counselorEmail,

        date,

        startTime,

        endTime,

        reason:
          reason?.trim() || "",

        infoEmail: INFO_EMAIL,

        infoName: INFO_NAME,
      });

    // --------------------------------------
    // SAVE CALENDAR DETAILS
    // --------------------------------------

    await blockerRef.update({
      googleCalendarEventId:
        calendarResult
          ?.calendarEventId ||
        null,

      googleCalendarEventUrl:
        calendarResult
          ?.calendarEventUrl ||
        null,

      updatedAt:
        Timestamp.now(),
    });

    console.log(
      `✅ Blocker added to Google Calendar: ${
        calendarResult?.calendarEventId ||
        "No event ID"
      }`
    );

    return {
      id: blockerRef.id,

      ...blocker,

      googleCalendarEventId:
        calendarResult
          ?.calendarEventId ||
        null,

      googleCalendarEventUrl:
        calendarResult
          ?.calendarEventUrl ||
        null,
    };
  } catch (calendarError) {
    console.error(
      "❌ Failed to create Google Calendar blocker:",
      calendarError
    );

    // --------------------------------------
    // ROLLBACK FIRESTORE
    // --------------------------------------

    try {
      await blockerRef.delete();

      console.log(
        "🗑️ Firestore blocker removed because Google Calendar creation failed."
      );
    } catch (deleteError) {
      console.error(
        "❌ Failed to roll back Firestore blocker:",
        deleteError
      );
    }

    const error = new Error(
      calendarError?.message ||
        "Failed to create Google Calendar availability block."
    );

    error.statusCode = 500;

    throw error;
  }
};

// ========================================
// GET ALL BLOCKERS
// ========================================

const getBlockers = async () => {
  const snapshot =
    await db
      .collection(BLOCKERS_COLLECTION)
      .orderBy("date", "asc")
      .get();

  return snapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data(),
    })
  );
};

// ========================================
// GET COUNSELOR BLOCKERS
// ========================================

const getCounselorBlockers =
  async (counselorId) => {
    if (!counselorId) {
      const error = new Error(
        "Counselor ID is required."
      );

      error.statusCode = 400;

      throw error;
    }

    const snapshot =
      await db
        .collection(
          BLOCKERS_COLLECTION
        )
        .where(
          "counselorId",
          "==",
          counselorId
        )
        .get();

    return snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );
  };

// ========================================
// DELETE BLOCKER
// ========================================

const deleteBlocker = async (data) => {
  const blockerId =
    data?.blockerId ||
    data?.id;

  if (!blockerId) {
    const error = new Error(
      "Blocker ID is required."
    );

    error.statusCode = 400;

    throw error;
  }

  // ----------------------------------------
  // GET BLOCKER
  // ----------------------------------------

  const blockerRef =
    db
      .collection(
        BLOCKERS_COLLECTION
      )
      .doc(blockerId);

  const blockerSnapshot =
    await blockerRef.get();

  if (!blockerSnapshot.exists) {
    const error = new Error(
      "Availability block not found."
    );

    error.statusCode = 404;

    throw error;
  }

  const blocker =
    blockerSnapshot.data();

  // ========================================
  // DELETE GOOGLE CALENDAR EVENT
  // ========================================

  if (
    blocker.googleCalendarEventId
  ) {
    try {
      console.log(
        `🗑️ Removing blocker from Google Calendar: ${blocker.googleCalendarEventId}`
      );

      await deleteBlockerCalendarEvent(
        blocker.googleCalendarEventId
      );

      console.log(
        "✅ Google Calendar blocker deleted."
      );
    } catch (calendarError) {
      console.error(
        "❌ Failed to delete Google Calendar blocker:",
        calendarError
      );

      const error = new Error(
        calendarError?.message ||
          "Failed to remove the blocker from Google Calendar."
      );

      error.statusCode = 500;

      throw error;
    }
  }

  // ========================================
  // DELETE FIRESTORE BLOCKER
  // ========================================

  await blockerRef.delete();

  console.log(
    `✅ Firestore blocker deleted: ${blockerId}`
  );

  return {
    blockerId,

    deleted: true,

    googleCalendarEventId:
      blocker.googleCalendarEventId ||
      null,
  };
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  createBlocker,

  getBlockers,

  getCounselorBlockers,

  deleteBlocker,

  isCounselorAvailable,
};