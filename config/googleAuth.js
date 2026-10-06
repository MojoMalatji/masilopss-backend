const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

// ========================================
// GET AUTHORIZED GOOGLE CLIENT
// ========================================

const getAuthorizedClient = async () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured.");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is not configured.");
  }

  if (!refreshToken) {
    throw new Error("GOOGLE_REFRESH_TOKEN is not configured.");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
};

// ========================================
// GENERATE GOOGLE AUTHORIZATION URL
// ========================================

const getGoogleAuthorizationUrl = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured.");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is not configured.");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
};

// ========================================
// EXCHANGE AUTHORIZATION CODE
// ========================================

const exchangeAuthorizationCode = async (code) => {
  if (!code) {
    throw new Error(
      "Google authorization code is required."
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured.");
  }

  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not configured.");
  }

  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is not configured.");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);

  return tokens;
};

module.exports = {
  getAuthorizedClient,
  getGoogleAuthorizationUrl,
  exchangeAuthorizationCode,
};