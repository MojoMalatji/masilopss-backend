const express = require("express");
const router = express.Router();

const {
  getGoogleAuthorizationUrl,
  exchangeAuthorizationCode,
} = require("../config/googleAuth");

// Start Google OAuth
router.get("/google/auth", (req, res) => {
  try {
    const authorizationUrl = getGoogleAuthorizationUrl();

    res.redirect(authorizationUrl);
  } catch (error) {
    console.error("Google authorization URL error:", error);

    res.status(500).send(
      "Could not start Google Calendar authorization."
    );
  }
});

// Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send(
        "Google authorization code is missing."
      );
    }

    const tokens = await exchangeAuthorizationCode(code);

    if (!tokens.refresh_token) {
      console.error(
        "Google authorization succeeded, but no refresh token was returned."
      );

      return res.status(400).send(`
        <h2>Authorization completed, but no refresh token was received.</h2>
        <p>Please authorize the application again.</p>
      `);
    }

    // IMPORTANT:
    // Do not log the actual refresh token.
    console.log(
      "Google Calendar authorization successful. Refresh token received."
    );

    // TEMPORARY ONE-TIME SETUP:
    // Display the refresh token so it can be copied into Render.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Authorization</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h2>Google Calendar authorization successful</h2>

          <p>
            A refresh token was successfully generated.
          </p>

          <p>
            Add the following to your Render environment variables:
          </p>

          <p>
            <strong>GOOGLE_REFRESH_TOKEN</strong>
          </p>

          <textarea
            readonly
            style="
              width: 100%;
              max-width: 800px;
              height: 120px;
              padding: 10px;
              font-family: monospace;
            "
          >${tokens.refresh_token}</textarea>

          <p style="color: red;">
            <strong>Important:</strong>
            Do not share this refresh token with anyone.
          </p>

          <p>
            After adding it to Render, redeploy the backend.
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