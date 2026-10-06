const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');

const { sendRideAssignedEmail } = require('../services/notificationService');

test('does not send ride-assigned email to demo accounts', async () => {
  const originalEmailUser = process.env.EMAIL_USER;
  const originalEmailPass = process.env.EMAIL_PASS;
  const originalCreateTransport = nodemailer.createTransport;
  let transportCreated = false;

  process.env.EMAIL_USER = 'sender@example.invalid';
  process.env.EMAIL_PASS = 'test-password';
  nodemailer.createTransport = () => {
    transportCreated = true;
    return { sendMail: async () => ({ messageId: 'test-message' }) };
  };

  try {
    await sendRideAssignedEmail({ name: 'Demo User', email: 'user@rydo.com' }, {
      pickup: 'Bengaluru',
      dropoff: 'Mysuru',
      otp: '1234'
    }, { name: 'Demo Driver' });

    assert.equal(transportCreated, false);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    if (originalEmailUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalEmailUser;
    if (originalEmailPass === undefined) delete process.env.EMAIL_PASS;
    else process.env.EMAIL_PASS = originalEmailPass;
  }
});