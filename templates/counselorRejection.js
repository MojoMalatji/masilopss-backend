module.exports = (booking) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Appointment Request Rejected</title>
</head>

<body style="font-family: Arial, sans-serif; line-height: 1.6;">

  <h2>Appointment Request Rejected</h2>

  <p>Hello ${booking.counselorName || "Counselor"},</p>

  <p>
    The following appointment request has been rejected
    and will not proceed.
  </p>

  <h3>Appointment Details</h3>

  <p>
    <strong>Client:</strong> ${booking.name}<br />
    <strong>Date:</strong> ${booking.date}<br />
    <strong>Time:</strong> ${booking.time}<br />
    <strong>Service:</strong> ${booking.service}
  </p>

  <p>
    Regards,<br />
    <strong>Mashilo Psyché & Social Solutions</strong>
  </p>

</body>
</html>
`;