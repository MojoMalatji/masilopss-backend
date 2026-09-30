// config/cors.js

const allowedOrigins = [
  // LOCAL DEVELOPMENT
  "http://localhost:3000",
  "http://localhost:3001",

  // PRODUCTION WEBSITE
  "https://www.mashilopss.co.za",
  "https://mashilopss.co.za",

  // FIREBASE HOSTING
  "https://mashilopss.web.app",
  "https://mashilopss.firebaseapp.com",

  // ADMIN
  "https://mashilopss-admin.web.app",

  // OPTIONAL ENVIRONMENT URL
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log("Allowed CORS origins:", allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Requests without an Origin header
    // such as server-to-server requests
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(
      `CORS blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `CORS policy: Origin ${origin} is not allowed.`
      )
    );
  },

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],

  credentials: true,

  optionsSuccessStatus: 204,
};

module.exports = corsOptions;