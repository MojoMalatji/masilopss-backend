module.exports = (booking) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Appointment Approved</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h2>Appointment Approved</h2>

  <p>Hello ${booking.name},</p>

  <p>
    Your appointment request with
    <strong>Mashilo Psyché & Social Solutions</strong>
    has been approved.
  </p>

  <h3>Appointment Details</h3>

  <p>
    <strong>Date:</strong> ${booking.date}<br />
    <strong>Time:</strong> ${booking.time}<br />
    <strong>Service:</strong> ${booking.service}<br />
    <strong>Location:</strong> ${booking.location || "To be confirmed"}<br />
    <strong>Counselor:</strong> ${booking.counselorName || "To be confirmed"}
  </p>

  ${
    booking.googleMeetLink
      ? `
        <p>
          <strong>Google Meet:</strong><br />
          <a href="${booking.googleMeetLink}">
            Join Google Meet
          </a>
        </p>
      `
      : ""
  }

  <p>
    Please keep this email for your records.
  </p>

  <p>
    Regards,<br />
    <strong>Mashilo Psyché & Social Solutions</strong>
  </p>

</body>
</html>
`;