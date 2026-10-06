const nodemailer = require('nodemailer');
const twilio = require('twilio');

exports.sendRideAssignedEmail = async (user, booking, driver) => {
  if (!user?.email) {
    console.log('No user email available for ride-assigned notification.');
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Gmail SMTP is not configured; ride-assigned email was not delivered.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Rydo driver is on the way',
      text: `Hello ${user.name},\n\n` +
        `Your ride has been assigned.\n\n` +
        `Driver: ${driver?.name || 'Driver'}\n` +
        `Phone: ${driver?.phone || 'N/A'}\n` +
        `Car: ${driver?.vehicle || 'N/A'}\n` +
        `Plate Number: ${driver?.plate || 'N/A'}\n` +
        `Pickup: ${booking.pickup}\n` +
        `Dropoff: ${booking.dropoff}\n` +
        `OTP: ${booking.otp}\n\n` +
        `Thank you for riding with Rydo.`
    };

    await transporter.sendMail(mailOptions);
    console.log('Ride-assigned email sent successfully.');
  } catch (error) {
    console.error('Ride-assigned email error:', error.message);
  }
};

const sendTwilioAlert = async (user, booking) => {
  const phone = user.emergencyContact?.phone || user.phone;
  if (!phone) {
    console.log('No emergency phone available for Twilio alert.');
    return false;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('Twilio is not configured; emergency SMS was not delivered.');
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: `${user.name} started a ride. Pickup: ${booking.pickup}. Dropoff: ${booking.dropoff}. OTP: ${booking.otp}.`,
      from: fromNumber,
      to: phone
    });
    console.log('Emergency alert sent via Twilio SMS.');
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error.message);
    return false;
  }
};

exports.sendEmergencyAlert = async (user, booking, force = false) => {
  if (!user) return { emailSent: false, smsSent: false, reason: 'user_missing' };
  const contactEmail = user.emergencyContact?.email;
  const contactPhone = user.emergencyContact?.phone || user.phone;
  if (!user.emergencyAlertsEnabled && !force) {
    console.log('Emergency alerts disabled or no contact details provided.');
    return { emailSent: false, smsSent: false, reason: 'alerts_disabled' };
  }

  if (!contactEmail && !contactPhone) {
    console.log('Emergency alerts disabled or no contact details provided.');
    return { emailSent: false, smsSent: false, reason: 'no_contact' };
  }

  let emailSent = false;
  if (contactEmail && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    console.warn('Gmail SMTP is not configured; emergency email was not delivered.');
  } else if (contactEmail) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      const driver = booking.driver && typeof booking.driver === 'object' ? booking.driver : null;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: contactEmail,
        subject: `RIDE ALERT: ${user.name} has started a ride`,
        text: `Hello ${user.emergencyContact.name || 'Emergency Contact'},\n\n` +
              `${user.name} has started a ride via Rydo.\n\n` +
              `Ride ID: ${booking._id}\n` +
              `Ride status: ${booking.status}\n` +
              `Pickup: ${booking.pickup}\n` +
              `Dropoff: ${booking.dropoff}\n` +
              `Ride type: ${booking.rideType || 'N/A'}\n` +
              `Trip mode: ${booking.tripMode || 'N/A'}\n` +
              `Distance: ${booking.distance || 'N/A'}\n` +
              `Estimated time: ${booking.time || 'N/A'}\n` +
              `Payment mode: ${booking.paymentMode || 'N/A'}\n` +
              `Driver: ${driver?.name || 'Not assigned'}\n` +
              `Driver phone: ${driver?.user?.phone || driver?.phone || 'N/A'}\n` +
              `Vehicle: ${driver?.vehicle || 'N/A'}\n` +
              `Plate: ${driver?.plate || 'N/A'}\n` +
              `Driver rating: ${driver?.rating ?? 'N/A'}\n` +
              `OTP for ride: ${booking.otp}\n` +
              `Estimated Fare: ${booking.fare}\n\n` +
              `Stay safe!`
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log('Emergency alert sent via Email.');
    } catch (error) {
      console.error('Emergency email error:', error.message);
    }
  }

  const smsSent = await sendTwilioAlert(user, booking);
  return { emailSent, smsSent };
};
