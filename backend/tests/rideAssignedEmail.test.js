const test = require('node:test');
const assert = require('node:assert/strict');
const { sendRideAssignedEmail } = require('../services/notificationService');

test('does not send ride-assigned email to demo accounts', async () => {
  const originalEmailUser = process.env.EMAIL_USER;
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalFetch = global.fetch;
  let fetchCalled = false;

  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.BREVO_API_KEY = 'test-api-key';
  global.fetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 201 };
  };

  try {
    await sendRideAssignedEmail({ name: 'Demo User', email: 'user@rydo.com' }, {
      pickup: 'Bengaluru',
      dropoff: 'Mysuru',
      otp: '1234'
    }, { name: 'Demo Driver' });

    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
    if (originalEmailUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalEmailUser;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = originalApiKey;
  }
});

test('sends real-user ride assignment notifications through the email API', async () => {
  const originalEmailUser = process.env.EMAIL_USER;
  const originalApiKey = process.env.BREVO_API_KEY;
  const originalFetch = global.fetch;
  let sentRequest;

  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.BREVO_API_KEY = 'test-api-key';
  global.fetch = async (url, options) => {
    sentRequest = { url, options };
    return { ok: true, status: 201 };
  };

  try {
    await sendRideAssignedEmail({ name: 'Test Rider', email: 'rider@example.invalid' }, {
      pickup: 'Bengaluru',
      dropoff: 'Mysuru',
      otp: '1234'
    }, { name: 'Test Driver', vehicle: 'Test Car', plate: 'TEST-123' });

    assert.equal(sentRequest.url, 'https://api.brevo.com/v3/smtp/email');
    const message = JSON.parse(sentRequest.options.body);
    assert.deepEqual(message.to, [{ email: 'rider@example.invalid' }]);
    assert.ok(message.textContent.includes('Bengaluru'));
    assert.ok(message.textContent.includes('Mysuru'));
    assert.ok(message.textContent.includes('1234'));
  } finally {
    global.fetch = originalFetch;
    if (originalEmailUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalEmailUser;
    if (originalApiKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = originalApiKey;
  }
});