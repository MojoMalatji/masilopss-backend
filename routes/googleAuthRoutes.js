const express = require("express");
const router = express.Router();

const {
  getGoogleAuthorizationUrl,
  exchangeAuthorizationCode,
} = require("../config/googleAuth");

// ========================================
// START GOOGLE OAUTH
// ========================================

router.get("/google/auth", (req, res) => {
  try {
    const authorizationUrl = getGoogleAuthorizationUrl();

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google authorization URL error:", error);

    res.status(500).send(`
  <h2>Could not start Google Calendar authorization</h2>
  <pre>${error.message || error}</pre>
`);
  }
});

// ========================================
// GOOGLE OAUTH CALLBACK
// ========================================

router.get(
  ["/google/callback", "/oauth2callback"],
  async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Google authorization code is missing.");
    }

    const tokens = await exchangeAuthorizationCode(code);

    if (!tokens.refresh_token) {
      console.error(
        "Google authorization succeeded, but no refresh token was returned.",
      );

      return res.status(400).send(`
        <h2>No refresh token received</h2>
        <p>
          Google did not return a refresh token.
          Please authorize the application again.
        </p>
      `);
    }

    // Never log the actual refresh token.
    console.log(
      "Google Calendar authorization successful. Refresh token received.",
    );

    // TEMPORARY:
    // Display the refresh token so it can be copied into Render.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>

        <body
          style="
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 900px;
            margin: auto;
          "
        >
          <h2>Google Calendar Authorization Successful</h2>

          <p>
            A Google refresh token was successfully generated.
          </p>

          <p>
            Add the following environment variable to Render:
          </p>

          <p>
            <strong>GOOGLE_REFRESH_TOKEN</strong>
          </p>

          <textarea
            readonly
            style="
              width: 100%;
              height: 120px;
              padding: 10px;
              font-family: monospace;
              font-size: 14px;
              box-sizing: border-box;
            "
          >${tokens.refresh_token}</textarea>

          <p style="color: red;">
            <strong>Important:</strong>
            Do not share this refresh token with anyone.
          </p>

          <p>
            After adding the token to Render, redeploy the backend.
          </p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Google OAuth callback error:", error);

    res.status(500).send("Google Calendar authorization failed.");
  }
});

module.exports = router;
