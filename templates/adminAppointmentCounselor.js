// templates/adminAppointmentCounselor.js

const adminAppointmentCounselor = (booking) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

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
        <strong>
          ${booking.counselorName || "Counsellor"}
        </strong>,
      </p>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
        "
      >
        You have a new appointment scheduled with
        you through
        <strong>
          Mashilo Psyché &amp; Social Solutions
        </strong>.
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
          <strong>Google Meet:</strong>

          <a
            href="${booking.googleMeetLink}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Join Meeting
          </a>
        </p>
        `
            : ""
        }

      </div>

      <!-- CLIENT DETAILS -->

      <div
        style="
          margin: 25px 0;
          padding: 20px;
          background-color: #fafafa;
          border: 1px solid #eeeeee;
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
          Client Details
        </h2>

        <p>
          <strong>Name:</strong>
          ${booking.name || "—"}
        </p>

        <p>
          <strong>Email:</strong>
          ${booking.email || "—"}
        </p>

        <p>
          <strong>Phone:</strong>
          ${booking.phone || "—"}
        </p>

        ${
          booking.info
            ? `
        <p>
          <strong>Additional Information:</strong>
        </p>

        <p
          style="
            white-space: pre-wrap;
            line-height: 1.6;
          "
        >
          ${booking.info}
        </p>
        `
            : ""
        }

      </div>

      <p
        style="
          font-size: 16px;
          line-height: 1.6;
        "
      >
        Please take note of the scheduled appointment
        and ensure that you are available at the
        specified date and time.
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

module.exports = adminAppointmentCounselor;