const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

const CREDENTIALS_PATH = path.join(
  __dirname,
  "..",
  "credentials.json"
);

const TOKEN_PATH = path.join(
  __dirname,
  "..",
  "token.json"
);

const getAuthorizedClient = async () => {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      "Google credentials.json was not found."
    );
  }

  const credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, "utf8")
  );

  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web || {};

  if (!client_id || !client_secret) {
    throw new Error(
      "Invalid Google OAuth credentials.json."
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris?.[0] ||
      "http://localhost:5000/oauth2callback"
  );

  // Use previously saved token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(
      fs.readFileSync(TOKEN_PATH, "utf8")
    );

    oauth2Client.setCredentials(token);

    return oauth2Client;
  }

  // No token yet — generate authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\n========================================");
  console.log(" GOOGLE CALENDAR AUTHORIZATION REQUIRED ");
  console.log("========================================\n");
  console.log(authUrl);
  console.log("\n========================================\n");

  throw new Error(
    "Google Calendar authorization required. Open the URL printed above."
  );
};

module.exports = {
  getAuthorizedClient,
  TOKEN_PATH,
  CREDENTIALS_PATH,
};