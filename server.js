const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// ---------------- MIDDLEWARE ----------------
// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://masilopss-backend.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ✅ ADD THIS RIGHT HERE 👇
app.options("*", cors());

// JSON middleware
app.use(express.json());

app.use(bodyParser.json());

// 🔥 DEBUG: show all requests
app.use((req, res, next) => {
  console.log("Request:", req.method, req.url);
  next();
});

// ---------------- FIREBASE ----------------
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

console.log("1. Server started");

if (!getApps().length) {
  console.log("2. Initializing Firebase...");
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

console.log("3. Firebase initialized");
console.log("4. Firestore ready");

// ---------------- ROUTES ----------------

// Test route
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
  console.log("Server running on port " + PORT);
});