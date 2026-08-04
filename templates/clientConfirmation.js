module.exports = (booking) => `
<div style="font-family:Arial,sans-serif">
    <h2>Booking Confirmation</h2>

    <p>Hello <strong>${booking.name}</strong>,</p>

    <p>Thank you for booking with Mashilo Psyché & Social Solutions.</p>

    <h3>Your Appointment</h3>

    <ul>
        <li><strong>Date:</strong> ${booking.date}</li>
        <li><strong>Time:</strong> ${booking.time}</li>
        <li><strong>Service:</strong> ${booking.service}</li>
        <li><strong>Location:</strong> ${booking.location}</li>
    </ul>

    <p>We will contact you shortly.</p>

    <hr>

    <p><strong>Mashilo Psyché & Social Solutions</strong></p>
</div>
`;