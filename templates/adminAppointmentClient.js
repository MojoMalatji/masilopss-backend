// templates/adminAppointmentClient.js

const adminAppointmentClient = (booking) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <meta name="viewport"
    content="width=device-width, initial-scale=1.0" />

  <title>Appointment Scheduled</title>
</head>

<body
  style="
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
    font-family: Arial, Helvetica, sans-serif;
    color: #333333;
  "
>
  <div
    style="
      max-width: 650px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    "
  >

    <!-- HEADER -->

    <div
      style="
        background-color: #2c3e50;
        color: #ffffff;
        padding: 25px;
        text-align: center;
      "
    >
      <h1
        style="
          margin: 0;
          font-size: 24px;
        "
      >
        Appointment Scheduled
      </h1>
    </div>

    <!-- CONTENT -->

    <div
      style="
        padding: 30px;
      "
    >

      <p
        style="
          font-size: 16px;
          margin-top: 0;
        "
      >
        Hello
        <strong>${booking.name || "Client"}</strong>,
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Your appointment with
        <strong>
          Mashilo Psyché &amp; Social Solutions
        </strong>
        has been scheduled successfully.
      </p>

      <!-- APPOINTMENT DETAILS -->

      <div
        style="
          margin: 25px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-left: 4px solid #2c3e50;
          border-radius: 5px;
        "
      >

        <h2
          style="
            margin-top: 0;
            font-size: 18px;
            color: #2c3e50;
          "
        >
          Appointment Details
        </h2>

        <p>
          <strong>Date:</strong>
          ${booking.date || "—"}
        </p>

        <p>
          <strong>Time:</strong>
          ${booking.time || "—"}
        </p>

        <p>
          <strong>Service:</strong>
          ${booking.service || "—"}
        </p>

        <p>
          <strong>Counsellor:</strong>
          ${booking.counselorName || "—"}
        </p>

        <p>
          <strong>Location:</strong>
          ${
            booking.location ||
            "Mashilo Psyché & Social Solutions"
          }
        </p>

        ${
          booking.googleMeetLink
            ? `
        <p>
          <strong>Online Meeting:</strong>
          <a
            href="${booking.googleMeetLink}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Google Meet
          </a>
        </p>
        `
            : ""
        }

      </div>

      ${
        booking.info
          ? `
      <div
        style="
          margin-top: 20px;
        "
      >
        <strong>Additional Information:</strong>

        <p
          style="
            white-space: pre-wrap;
            line-height: 1.6;
          "
        >
          ${booking.info}
        </p>
      </div>
      `
          : ""
      }

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
        "
      >
        We look forward to seeing you at your
        scheduled appointment.
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
        "
      >
        If you have any questions or need to make
        changes to your appointment, please contact us.
      </p>

      <p
        style="
          margin-top: 30px;
          line-height: 1.6;
        "
      >
        Kind regards,<br />

        <strong>
          Mashilo Psyché &amp; Social Solutions
        </strong>
      </p>

    </div>

  </div>
</body>
</html>
  `;
};

module.exports = adminAppointmentClient;