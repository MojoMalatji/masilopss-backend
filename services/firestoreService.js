const db = require("../config/firebase");

const saveBooking = async (booking) => {
  const docRef = await db.collection("bookings").add({
    ...booking,
    createdAt: new Date(),
  });

  return docRef.id;
};

const getBookings = async () => {
  const snapshot = await db
    .collection("bookings")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
};

module.exports = {
  saveBooking,
  getBookings,
};