require("dotenv").config();

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
        /\\n/g,
        "\n"
      ),
    }),
  });
}

const users = [
  {
    email: "pride@mashilopss.co.za",
    password: "Sebatjane@1",
  },
    {
    email: "info@mashilopss.co.za",
    password: "Info@2026",
  }
];

const setPasswords = async () => {
  try {
    for (const user of users) {
      const firebaseUser =
        await admin.auth().getUserByEmail(user.email);

      await admin.auth().updateUser(
        firebaseUser.uid,
        {
          password: user.password,
        }
      );

      console.log(
        `✅ Password set for ${user.email}`
      );
    }

    console.log("✅ All passwords updated successfully.");
  } catch (error) {
    console.error(
      "❌ Failed to update passwords:",
      error
    );
  } finally {
    process.exit();
  }
};

setPasswords();