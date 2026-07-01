const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ---------------- MIDDLEWARE ----------------

// CORS (production + local)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://masilopss-backend.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Preflight support
app.options("*", cors());

// JSON parser (ONLY THIS — no bodyParser needed)
app.use(express.json());

// Debug logger
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

    res.json({
      success: true,
      message: "Booking saved successfully",
      id: docRef.id,
    });

  } catch (error) {
    console.error("❌ Booking error:", error);

    res.status(500).json({
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