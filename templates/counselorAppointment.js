module.exports = (booking) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Appointment Assigned</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h2>New Appointment Assigned</h2>

  <p>Hello ${booking.counselorName || "Counselor"},</p>

  <p>
    You have been assigned a new appointment through
    <strong>Mashilo Psyché & Social Solutions</strong>.
  </p>

  <h3>Appointment Details</h3>

  <p>
    <strong>Client:</strong> ${booking.name}<br />
    <strong>Email:</strong> ${booking.email}<br />
    <strong>Phone:</strong> ${booking.phone || "Not provided"}<br />
    <strong>Date:</strong> ${booking.date}<br />
    <strong>Time:</strong> ${booking.time}<br />
    <strong>Service:</strong> ${booking.service}<br />
    <strong>Location:</strong> ${booking.location || "To be confirmed"}
  </p>

  ${
    booking.info
      ? `
        <h3>Client Information</h3>
        <p>${booking.info}</p>
      `
      : ""
  }

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
    Regards,<br />
    <strong>Mashilo Psyché & Social Solutions</strong>
  </p>

</body>
</html>
`;