const resolveStripeConfig = () => {
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  const validSecretKey = secretKey.startsWith('sk_') ? secretKey : null;
  const validWebhookSecret = webhookSecret.startsWith('whsec_') ? webhookSecret : null;

  return {
    stripeSecretKey: validSecretKey || (webhookSecret.startsWith('sk_') ? webhookSecret : null),
    webhookSecret: validWebhookSecret || (secretKey.startsWith('whsec_') ? secretKey : null)
  };
};

const { stripeSecretKey, webhookSecret } = resolveStripeConfig();
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const toCents = (fare) => {
  if (!fare && fare !== 0) return 0;
  const numericValue = Number(String(fare).replace(/[^\d.]/g, ''));
  if (Number.isNaN(numericValue)) return 0;
  return Math.round(numericValue * 100);
};

exports.createPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.paymentMode !== 'Cash') return res.status(400).json({ message: 'Online payments must use Stripe Checkout' });

    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        booking: booking._id,
        user: req.user.id,
        amount: booking.fare,
        method: 'Cash',
        status: 'Pending',
        transactionId: `CASH-${Date.now()}`,
        receiptId: `RYDO-${Date.now().toString().slice(-8)}`,
        paidAt: null
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ payment, gateway: 'cash' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Payment could not be completed' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const resolvedConfig = resolveStripeConfig();
    const activeStripeKey = resolvedConfig.stripeSecretKey;
    const activeWebhookSecret = resolvedConfig.webhookSecret;

    if (!activeStripeKey) {
      return res.status(400).json({ message: 'Stripe is not configured. Add STRIPE_SECRET_KEY to enable real payments.' });
    }

    const { bookingId } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (!activeWebhookSecret) {
      await Booking.updateOne({ _id: booking._id, status: 'Payment Pending' }, { status: 'Payment Failed' });
      return res.status(503).json({ message: 'Stripe webhook signing is not configured. Online checkout is unavailable.' });
    }
    if (!['Card', 'UPI'].includes(booking.paymentMode)) {
      return res.status(400).json({ message: 'Stripe Checkout is only available for online payments' });
    }

    const amount = toCents(booking.fare);
    if (amount <= 0) return res.status(400).json({ message: 'Booking fare is invalid' });
    const frontendUrl = (process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `Rydo Ride: ${booking.pickup} to ${booking.dropoff}`
          },
          unit_amount: amount
        },
        quantity: 1
      }],
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id
      },
      success_url: `${frontendUrl}/receipt/${booking._id}?status=success`,
      cancel_url: `${frontendUrl}/book?payment=cancelled`
    });

    const payment = await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        booking: booking._id,
        user: req.user.id,
        amount: booking.fare,
        method: booking.paymentMode || 'Card',
        status: 'Pending',
        transactionId: session.id,
        receiptId: `RYDO-${Date.now().toString().slice(-8)}`,
        paidAt: null
      },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ url: session.url, payment, gateway: 'stripe' });
  } catch (error) {
    console.error('Stripe session error:', error.message);
    res.status(500).json({ message: 'Stripe checkout failed', error: error.message });
  }
};

exports.getPayment = async (req, res) => {
  const payment = await Payment.findOne({ booking: req.params.bookingId, user: req.user.id }).populate('booking');
  if (!payment) return res.status(404).json({ message: 'Receipt not found' });
  res.json(payment);
};

exports.handleStripeWebhook = async (req, res) => {
  const resolvedConfig = resolveStripeConfig();
  const activeStripeKey = resolvedConfig.stripeSecretKey;
  const activeWebhookSecret = resolvedConfig.webhookSecret;

  if (!stripe || !activeStripeKey || !activeWebhookSecret) {
    return res.status(503).json({ message: 'Stripe webhook is not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], activeWebhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
  }

  const session = event.data.object;
  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    if (session.payment_status === 'paid') {
      const payment = await Payment.findOneAndUpdate(
        { transactionId: session.id },
        { status: 'Paid', paidAt: new Date() },
        { returnDocument: 'after' }
      );
      if (payment) await Booking.updateOne({ _id: payment.booking, status: 'Payment Pending' }, { status: 'Searching' });
    }
  } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
    const payment = await Payment.findOneAndUpdate({ transactionId: session.id }, { status: 'Failed', paidAt: null }, { returnDocument: 'after' });
    if (payment) await Booking.updateOne({ _id: payment.booking, status: 'Payment Pending' }, { status: 'Payment Failed' });
  }

  res.json({ received: true });
};