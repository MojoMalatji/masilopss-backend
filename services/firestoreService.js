const db = require("../config/firebase");

const BOOKINGS_COLLECTION = "bookings";

/**
 * ========================================
 * SAVE BOOKING
 * ========================================
 */
const saveBooking = async (booking) => {
  try {
    const bookingData = {
      name:
        booking.name?.trim() || "",

      email:
        booking.email
          ?.trim()
          .toLowerCase() || "",

      phone:
        booking.phone?.trim() || "",

      date:
        booking.date || "",

      time:
        booking.time || "",

      service:
        booking.service || "",

      location:
        booking.location || "",

      info:
        booking.info?.trim() || "",

      /*
       * Website bookings default to pending.
       *
       * Admin-created bookings can explicitly
       * be created as approved.
       */
      status:
        booking.status || "pending",

      /*
       * Counselor
       */
      counselorId:
        booking.counselorId || null,

      counselorName:
        booking.counselorName || null,

      counselorEmail:
        booking.counselorEmail || null,

      /*
       * Google Calendar / Google Meet
       */
      calendarEventId:
        booking.calendarEventId || null,

      googleMeetLink:
        booking.googleMeetLink || null,

      /*
       * Notification tracking
       */
      emailNotificationSent:
        false,

      clientApprovalEmailSent:
        false,

      counselorEmailSent:
        false,

      clientRejectionEmailSent:
        false,

      counselorRejectionEmailSent:
        false,

      /*
       * Booking source
       *
       * website
       * admin
       */
      source:
        booking.source || "website",

      /*
       * Dates
       */
      createdAt:
        new Date(),

      updatedAt:
        new Date(),
    };

    const bookingRef =
      await db
        .collection(
          BOOKINGS_COLLECTION
        )
        .add(bookingData);

    console.log(
      `✅ Booking saved successfully: ${bookingRef.id}`
    );

    return bookingRef.id;
  } catch (error) {
    console.error(
      "❌ Firestore saveBooking error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * GET ALL BOOKINGS
 * ========================================
 */
const getBookings = async () => {
  try {
    const snapshot =
      await db
        .collection(
          BOOKINGS_COLLECTION
        )
        .orderBy(
          "createdAt",
          "desc"
        )
        .get();

    return snapshot.docs.map(
      (doc) => ({
        id: doc.id,
        ...doc.data(),
      })
    );
  } catch (error) {
    console.error(
      "❌ Firestore getBookings error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * GET ONE BOOKING
 * ========================================
 */
const getBookingById = async (
  bookingId
) => {
  try {
    const bookingRef =
      db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId);

    const snapshot =
      await bookingRef.get();

    if (!snapshot.exists) {
      throw new Error(
        "Booking not found."
      );
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    };
  } catch (error) {
    console.error(
      "❌ getBookingById error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * APPROVE BOOKING
 * ========================================
 */
const approveBooking = async ({
  bookingId,
  counselorId,
  counselorName,
  counselorEmail,
}) => {
  try {
    const bookingRef =
      db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId);

    const bookingSnapshot =
      await bookingRef.get();

    if (!bookingSnapshot.exists) {
      throw new Error(
        "Booking not found."
      );
    }

    await bookingRef.update({
      status:
        "approved",

      counselorId:
        counselorId,

      counselorName:
        counselorName,

      counselorEmail:
        counselorEmail,

      updatedAt:
        new Date(),
    });

    console.log(
      `✅ Booking approved in Firestore: ${bookingId}`
    );

    return getBookingById(
      bookingId
    );
  } catch (error) {
    console.error(
      "❌ approveBooking error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * REJECT BOOKING
 * ========================================
 */
const rejectBooking = async ({
  bookingId,
  counselorId,
  counselorName,
  counselorEmail,
}) => {
  try {
    const bookingRef =
      db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId);

    const bookingSnapshot =
      await bookingRef.get();

    if (!bookingSnapshot.exists) {
      throw new Error(
        "Booking not found."
      );
    }

    const updateData = {
      status:
        "rejected",

      updatedAt:
        new Date(),
    };

    /*
     * Keep counselor information
     * if a counselor was selected.
     */
    if (counselorId) {
      updateData.counselorId =
        counselorId;
    }

    if (counselorName) {
      updateData.counselorName =
        counselorName;
    }

    if (counselorEmail) {
      updateData.counselorEmail =
        counselorEmail;
    }

    await bookingRef.update(
      updateData
    );

    console.log(
      `✅ Booking rejected in Firestore: ${bookingId}`
    );

    return getBookingById(
      bookingId
    );
  } catch (error) {
    console.error(
      "❌ rejectBooking error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * CANCEL BOOKING
 * ========================================
 *
 * This is called AFTER the Google Calendar
 * event has successfully been deleted.
 *
 * It:
 * - marks booking as cancelled
 * - clears Calendar event ID
 * - clears Google Meet link
 */
const cancelBooking = async (
  bookingId
) => {
  try {
    const bookingRef =
      db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId);

    const bookingSnapshot =
      await bookingRef.get();

    if (!bookingSnapshot.exists) {
      throw new Error(
        "Booking not found."
      );
    }

    const currentBooking =
      bookingSnapshot.data();

    /*
     * Prevent unnecessary cancellation
     * of an already cancelled booking.
     */
    if (
      currentBooking.status ===
      "cancelled"
    ) {
      console.log(
        `ℹ️ Booking is already cancelled: ${bookingId}`
      );

      return getBookingById(
        bookingId
      );
    }

    await bookingRef.update({
      status:
        "cancelled",

      /*
       * Calendar event has already been
       * deleted by googleCalendarService.
       */
      calendarEventId:
        null,

      /*
       * Google Meet belongs to the
       * Calendar event, so clear it too.
       */
      googleMeetLink:
        null,

      updatedAt:
        new Date(),
    });

    console.log(
      `✅ Booking cancelled in Firestore: ${bookingId}`
    );

    return getBookingById(
      bookingId
    );
  } catch (error) {
    console.error(
      "❌ cancelBooking error:",
      error
    );

    throw error;
  }
};

/**
 * ========================================
 * UPDATE NOTIFICATION STATUS
 * ========================================
 */
const updateNotificationStatus =
  async (
    bookingId,
    notifications
  ) => {
    try {
      const updateData = {
        updatedAt:
          new Date(),
      };

      if (
        notifications &&
        notifications.clientApprovalEmail !==
          undefined
      ) {
        updateData.clientApprovalEmailSent =
          notifications.clientApprovalEmail;
      }

      if (
        notifications &&
        notifications.counselorEmail !==
          undefined
      ) {
        updateData.counselorEmailSent =
          notifications.counselorEmail;
      }

      if (
        notifications &&
        notifications.clientRejectionEmail !==
          undefined
      ) {
        updateData.clientRejectionEmailSent =
          notifications.clientRejectionEmail;
      }

      if (
        notifications &&
        notifications.counselorRejectionEmail !==
          undefined
      ) {
        updateData.counselorRejectionEmailSent =
          notifications.counselorRejectionEmail;
      }

      await db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId)
        .update(updateData);

      console.log(
        `✅ Notification status updated: ${bookingId}`
      );
    } catch (error) {
      console.error(
        "❌ updateNotificationStatus error:",
        error
      );

      throw error;
    }
  };

/**
 * ========================================
 * UPDATE GOOGLE CALENDAR DETAILS
 * ========================================
 */
const updateCalendarDetails =
  async (
    bookingId,
    calendarResult
  ) => {
    try {
      const updateData = {
        calendarEventId:
          calendarResult
            ?.calendarEventId ||
          null,

        googleMeetLink:
          calendarResult
            ?.googleMeetLink ||
          null,

        updatedAt:
          new Date(),
      };

      await db
        .collection(
          BOOKINGS_COLLECTION
        )
        .doc(bookingId)
        .update(updateData);

      console.log(
        `✅ Calendar details saved: ${bookingId}`
      );
    } catch (error) {
      console.error(
        "❌ updateCalendarDetails error:",
        error
      );

      throw error;
    }
  };

/**
 * ========================================
 * EXPORTS
 * ========================================
 */
module.exports = {
  saveBooking,
  getBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  cancelBooking,
  updateNotificationStatus,
  updateCalendarDetails,
};