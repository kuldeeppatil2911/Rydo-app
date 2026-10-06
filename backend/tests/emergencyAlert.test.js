const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');

const { sendEmergencyAlert } = require('../services/notificationService');

const providerKeys = [
  'EMAIL_USER',
  'EMAIL_PASS',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

test('reports undelivered channels when alert providers are not configured', async () => {
  const originalValues = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  providerKeys.forEach((key) => delete process.env[key]);

  try {
    const delivery = await sendEmergencyAlert({
      name: 'Test Rider',
      emergencyAlertsEnabled: true,
      emergencyContact: { email: 'contact@example.invalid' }
    }, {
      _id: 'test-ride',
      status: 'In Progress',
      pickup: 'A',
      dropoff: 'B',
      otp: '1234'
    }, true);

    assert.deepEqual(delivery, {
      emailSent: false,
      smsSent: false,
      reason: 'email_not_configured'
    });
  } finally {
    providerKeys.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  }
});

test('sends the full ride summary to the saved emergency email', async () => {
  const originalValues = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  const originalCreateTransport = nodemailer.createTransport;
  let sentMessage;
  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.EMAIL_PASS = 'test-password';
  providerKeys.slice(2).forEach((key) => delete process.env[key]);
  nodemailer.createTransport = () => ({
    sendMail: async (message) => {
      sentMessage = message;
      return { messageId: 'test-message' };
    }
  });

  try {
    const delivery = await sendEmergencyAlert({
      name: 'Test Rider',
      emergencyAlertsEnabled: true,
      emergencyContact: { name: 'Test Contact', email: 'contact@example.invalid' }
    }, {
      _id: 'test-ride',
      status: 'In Progress',
      pickup: 'Pickup A',
      dropoff: 'Dropoff B',
      rideType: 'Premium',
      tripMode: 'One Way',
      distance: '12 km',
      time: '24 mins',
      paymentMode: 'Cash',
      fare: 'INR 220',
      otp: '1234',
      driver: {
        name: 'Demo Driver',
        vehicle: 'Test Sedan',
        plate: 'TEST-123',
        rating: 4.8,
        user: { phone: '+15555550123' }
      }
    }, true);

    assert.deepEqual(delivery, { emailSent: true, smsSent: false });
    assert.equal(sentMessage.to, 'contact@example.invalid');
    for (const detail of ['test-ride', 'Pickup A', 'Dropoff B', 'Premium', 'One Way', '12 km', '24 mins', 'Cash', '1234', 'INR 220', 'Demo Driver', '+15555550123', 'Test Sedan', 'TEST-123', '4.8']) {
      assert.ok(sentMessage.text.includes(detail), `Expected email to include ${detail}`);
    }
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    providerKeys.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  }
});