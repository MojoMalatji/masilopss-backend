module.exports = (booking) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Appointment Request Update</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h2>Appointment Request Update</h2>

  <p>Hello ${booking.name},</p>

  <p>
    Thank you for contacting
    <strong>Mashilo Psyché & Social Solutions</strong>.
  </p>

  <p>
    Unfortunately, we are unable to approve your appointment
    request for the following requested time:
  </p>

  <p>
    <strong>Date:</strong> ${booking.date}<br />
    <strong>Time:</strong> ${booking.time}<br />
    <strong>Service:</strong> ${booking.service}
  </p>

  <p>
    Please contact us if you would like to arrange an
    alternative appointment time.
  </p>

  <p>
    Regards,<br />
    <strong>Mashilo Psyché & Social Solutions</strong>
  </p>

</body>
</html>
`;