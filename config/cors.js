const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://masilopss-backend.onrender.com",
  // Add your deployed frontend URL here later
];

module.exports = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },

  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};