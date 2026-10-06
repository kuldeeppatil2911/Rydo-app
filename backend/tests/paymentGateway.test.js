const test = require('node:test');
const assert = require('node:assert/strict');

const { getPaymentMode } = require('../services/paymentGateway');

test('returns mock mode when Stripe key is missing', () => {
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal(getPaymentMode(), 'mock');
});
