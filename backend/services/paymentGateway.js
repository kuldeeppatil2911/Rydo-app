const { randomUUID } = require('node:crypto');

function getPaymentMode() {
  return process.env.STRIPE_SECRET_KEY ? 'stripe' : 'mock';
}

function createTestPaymentSession({ amount, currency = 'INR', metadata = {} }) {
  return {
    id: randomUUID(),
    amount,
    currency,
    status: 'test_mode',
    metadata,
    mode: getPaymentMode(),
    paymentLink: 'https://example.com/test-payment'
  };
}

module.exports = {
  getPaymentMode,
  createTestPaymentSession
};
