const test = require('node:test');
const assert = require('node:assert/strict');
const { sendEmergencyAlert } = require('../services/notificationService');

const providerKeys = [
  'EMAIL_USER',
  'EMAIL_PASS',
  'BREVO_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER'
];

test('reports undelivered channels when alert providers are not configured', async () => {
  const originalValues = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  providerKeys.forEach((key) => delete process.env[key]);
  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.EMAIL_PASS = 'existing-unused-password';
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 201 };
  };

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
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
    providerKeys.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  }
});

test('sends the full ride summary to the saved emergency email', async () => {
  const originalValues = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  let sentRequest;
  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.BREVO_API_KEY = 'test-api-key';
  providerKeys.slice(3).forEach((key) => delete process.env[key]);
  global.fetch = async (url, options) => {
    sentRequest = { url, options };
    return { ok: true, status: 201 };
  };

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
    assert.equal(sentRequest.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(sentRequest.options.headers['api-key'], 'test-api-key');
    const sentMessage = JSON.parse(sentRequest.options.body);
    assert.deepEqual(sentMessage.sender, { email: 'sender@example.invalid', name: 'Rydo' });
    assert.deepEqual(sentMessage.to, [{ email: 'contact@example.invalid' }]);
    for (const detail of ['test-ride', 'Pickup A', 'Dropoff B', 'Premium', 'One Way', '12 km', '24 mins', 'Cash', '1234', 'INR 220', 'Demo Driver', '+15555550123', 'Test Sedan', 'TEST-123', '4.8']) {
      assert.ok(sentMessage.textContent.includes(detail), `Expected email to include ${detail}`);
    }
  } finally {
    global.fetch = originalFetch;
    providerKeys.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  }
});

test('reports when the email provider rejects the emergency message', async () => {
  const originalValues = Object.fromEntries(providerKeys.map((key) => [key, process.env[key]]));
  const originalFetch = global.fetch;
  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.BREVO_API_KEY = 'test-api-key';
  providerKeys.slice(3).forEach((key) => delete process.env[key]);
  global.fetch = async () => ({ ok: false, status: 401 });

  try {
    const delivery = await sendEmergencyAlert({
      name: 'Test Rider',
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
      reason: 'email_delivery_failed'
    });
  } finally {
    global.fetch = originalFetch;
    providerKeys.forEach((key) => {
      if (originalValues[key] === undefined) delete process.env[key];
      else process.env[key] = originalValues[key];
    });
  }
});