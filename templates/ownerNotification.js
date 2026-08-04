module.exports = (booking) => `
<div style="font-family:Arial,sans-serif">

<h2> New Booking Received</h2>

<table border="1" cellpadding="8" cellspacing="0">

<tr><td><strong>Name</strong></td><td>${booking.name}</td></tr>

<tr><td><strong>Email</strong></td><td>${booking.email}</td></tr>

<tr><td><strong>Phone</strong></td><td>${booking.phone}</td></tr>

<tr><td><strong>Date</strong></td><td>${booking.date}</td></tr>

<tr><td><strong>Time</strong></td><td>${booking.time}</td></tr>

<tr><td><strong>Location</strong></td><td>${booking.location}</td></tr>

<tr><td><strong>Service</strong></td><td>${booking.service}</td></tr>

<tr><td><strong>Message</strong></td><td>${booking.message || "None"}</td></tr>

</table>

</div>
`;