const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  methods: ["GET", "POST"],
}));

app.use(bodyParser.json());

// 🔥 DEBUG: show all requests
app.use((req, res, next) => {
  console.log("Request:", req.method, req.url);
  next();
});

// ---------------- FIREBASE ----------------
console.log("1. Server started");
 s

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

console.log("2. Firebase key loaded");
require("dotenv").config();

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

if (!getApps().length) {
  console.log("3. Initializing Firebase...");
  initializeApp({
    credential: cert(serviceAccount),
  });
}

console.log("4. Firebase initialized");

const db = getFirestore();
console.log("5. Firestore ready");

// ---------------- ROUTES ----------------

// Test route (optional)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// CREATE BOOKING
app.post("/createBooking", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      date,
      time,
      location,
      service,
      message,
    } = req.body;

    const docRef = await db.collection("bookings").add({
      name,
      email,
      phone,
      date,
      time,
      location,
      service,
      message,
      createdAt: new Date(),
    });

    console.log("📩 Booking saved:", docRef.id);

    return res.json({
      success: true,
      message: "Booking saved successfully",
      id: docRef.id,
    });

  } catch (error) {
    console.error("❌ Booking error:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("6. Server running on port " + PORT);
});