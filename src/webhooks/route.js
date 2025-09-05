const express = require('express');
const router = express.Router();
const { stripe } = require('../lib/stripe');
const { handleSubscriptionEvent } = require('../lib/subscription');
const Stripe = require('stripe');

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

router.post('/', async (req, res) => {
  const body = req.rawBody; // Assuming raw body is available via middleware
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Stripe signature or webhook secret is missing.');
    return res.status(400).json({ error: 'Webhook secret not configured' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (relevantEvents.has(event.type)) {
    try {
      await handleSubscriptionEvent(event);
    } catch (error) {
      console.error('Error handling subscription event:', error);
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  return res.json({ received: true });
});

module.exports = router;
