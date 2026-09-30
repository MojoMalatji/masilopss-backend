// routes/googleAuthRoutes.js

const express = require("express");
const { google } = require("googleapis");

const router = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
];

// ----------------------------------------
// Create OAuth client
// ----------------------------------------

const getOAuthClient = () => {
  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured."
    );
  }

  if (!clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_SECRET is not configured."
    );
  }

  if (!redirectUri) {
    throw new Error(
      "GOOGLE_REDIRECT_URI is not configured."
    );
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
};

// ----------------------------------------
// Start Google authorization
// ----------------------------------------

router.get(
  "/auth/google",
  (req, res) => {
    try {
      const oauth2Client =
        getOAuthClient();

      const authUrl =
        oauth2Client.generateAuthUrl({
          access_type: "offline",
          prompt: "consent",
          scope: SCOPES,
        });

      console.log(
        "🔐 Starting Google Calendar authorization..."
      );

      res.redirect(authUrl);
    } catch (error) {
      console.error(
        "❌ Google authorization error:",
        error
      );

      res.status(500).send(
        error?.message ||
          "Unable to start Google authorization."
      );
    }
  }
);

// ----------------------------------------
// Google OAuth callback
// ----------------------------------------

router.get(
  "/oauth2callback",
  async (req, res) => {
    try {
      const code = req.query.code;

      if (!code) {
        return res.status(400).send(`
          <h1>❌ Authorization Failed</h1>
          <p>No authorization code was provided by Google.</p>
        `);
      }

      console.log(
        "🔄 Exchanging Google authorization code for tokens..."
      );

      const oauth2Client =
        getOAuthClient();

      const { tokens } =
        await oauth2Client.getToken(code);

      const refreshToken =
        tokens?.refresh_token;

      if (!refreshToken) {
        console.error(
          "❌ Google did not return a refresh token."
        );

        return res.status(500).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Google Authorization Failed</title>
            </head>

            <body
              style="
                font-family: Arial, sans-serif;
                padding: 40px;
                text-align: center;
              "
            >
              <h1>❌ No Refresh Token</h1>

              <p>
                Google authorized the application,
                but did not return a refresh token.
              </p>

              <p>
                Make sure you used:
              </p>

              <pre>
access_type: offline
prompt: consent
              </pre>

              <p>
                Then revoke the existing Mashilo PSS
                authorization in your Google account and
                authorize again.
              </p>
            </body>
          </html>
        `);
      }

      // ----------------------------------------
      // SUCCESS
      // ----------------------------------------

      console.log(
        "========================================"
      );

      console.log(
        "✅ GOOGLE CALENDAR AUTHORIZATION SUCCESSFUL"
      );

      console.log(
        "========================================"
      );

      console.log(
        "🔐 GOOGLE_REFRESH_TOKEN:"
      );

      console.log(
        refreshToken
      );

      console.log(
        "========================================"
      );

      console.log(
        "⚠️ Do not commit this token to GitHub."
      );

      console.log(
        "========================================"
      );

      // ----------------------------------------
      // Browser response
      // ----------------------------------------

      return res.send(`
        <!DOCTYPE html>

        <html>
          <head>
            <title>
              Google Calendar Authorization
            </title>
          </head>

          <body
            style="
              margin:0;
              padding:40px;
              background:#f5f5f5;
              font-family:Arial,sans-serif;
            "
          >

            <div
              style="
                max-width:700px;
                margin:0 auto;
                background:white;
                padding:35px;
                border-radius:12px;
                box-shadow:0 4px 20px rgba(0,0,0,.1);
              "
            >

              <h1
                style="
                  color:#2e7d32;
                  margin-top:0;
                "
              >
                ✅ Google Calendar Authorization Successful
              </h1>

              <p>
                Google Calendar has been successfully
                authorized.
              </p>

              <h3>
                Your Google Refresh Token
              </h3>

              <p
                style="
                  color:#b71c1c;
                  font-weight:bold;
                "
              >
                ⚠️ Keep this secret. Do not send it to
                anyone or commit it to GitHub.
              </p>

              <textarea
                readonly
                style="
                  width:100%;
                  min-height:120px;
                  box-sizing:border-box;
                  padding:15px;
                  font-family:monospace;
                  font-size:14px;
                  border:1px solid #ccc;
                  border-radius:8px;
                  resize:vertical;
                "
              >${refreshToken}</textarea>

              <h3>
                Add it to your .env
              </h3>

              <pre
                style="
                  background:#f4f4f4;
                  padding:15px;
                  border-radius:8px;
                  overflow:auto;
                "
              >GOOGLE_REFRESH_TOKEN=${refreshToken}</pre>

              <p>
                After adding it to your environment
                variables, restart your backend.
              </p>

              <p>
                You can now close this window.
              </p>

            </div>

          </body>
        </html>
      `);
    } catch (error) {
      console.error(
        "❌ Google OAuth callback error:",
        error
      );

      return res.status(500).send(`
        <!DOCTYPE html>

        <html>
          <head>
            <title>
              Google Calendar Authorization Failed
            </title>
          </head>

          <body
            style="
              font-family:Arial,sans-serif;
              padding:40px;
            "
          >

            <h1>
              ❌ Google Calendar Authorization Failed
            </h1>

            <p>
              ${error?.message ||
              "Unknown Google OAuth error."}
            </p>

          </body>
        </html>
      `);
    }
  }
);

module.exports = router;