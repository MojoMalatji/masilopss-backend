const express = require("express");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const router = express.Router();

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

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

// ----------------------------------------
// Start Google authorization
// ----------------------------------------

router.get("/auth/google", (req, res) => {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      return res.status(500).send(
        "credentials.json was not found."
      );
    }

    const credentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_PATH, "utf8")
    );

    const {
      client_secret,
      client_id,
      redirect_uris,
    } = credentials.installed || credentials.web || {};

    if (!client_id || !client_secret) {
      return res.status(500).send(
        "Invalid Google OAuth credentials."
      );
    }

    const redirectUri =
      "http://localhost:5000/oauth2callback";

    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "consent",
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error(
      "Google authorization error:",
      error
    );

    res.status(500).send(
      "Unable to start Google authorization."
    );
  }
});

// ----------------------------------------
// Google OAuth callback
// ----------------------------------------

router.get("/oauth2callback", async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send(
        "Authorization code was not provided."
      );
    }

    const credentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_PATH, "utf8")
    );

    const {
      client_secret,
      client_id,
    } = credentials.installed || credentials.web || {};

    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      "http://localhost:5000/oauth2callback"
    );

    const { tokens } =
      await oauth2Client.getToken(code);

    fs.writeFileSync(
      TOKEN_PATH,
      JSON.stringify(tokens, null, 2)
    );

    console.log(
      "✅ Google Calendar authorization successful."
    );

    res.send(`
      <html>
        <head>
          <title>Google Calendar Connected</title>
        </head>

        <body
          style="
            font-family: Arial, sans-serif;
            padding: 40px;
            text-align: center;
          "
        >
          <h1>✅ Google Calendar Connected</h1>

          <p>
            Mashilo PSS can now create Google Calendar
            appointments.
          </p>

          <p>
            You can close this window and return to the
            admin panel.
          </p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(
      "Google OAuth callback error:",
      error
    );

    res.status(500).send(
      "Google Calendar authorization failed."
    );
  }
});

module.exports = router;