// pages/api/stripe-webhook.js
// This is the source of truth for "did the payment actually happen."
// Never mark a slip paid from the frontend/success page alone — always
// confirm via this webhook, which Stripe calls directly (can't be spoofed
// because we verify the signature below).

import Stripe from 'stripe';
import { query } from '../../lib/db';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: { bodyParser: false }, // Stripe needs the raw body to verify the signature
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      await query(
        `UPDATE slips
         SET status = 'paid',
             stripe_payment_intent_id = $1,
             paid_at = now()
         WHERE stripe_session_id = $2`,
        [session.payment_intent, session.id]
      );
      console.log(`Slip paid for session ${session.id}`);
    } catch (err) {
      console.error('Failed to mark slip paid:', err);
      // Still return 200 so Stripe doesn't retry forever; log for manual follow-up
    }
  }

  // If checkout expires/is abandoned, Stripe also fires this — release the slip
  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    try {
      await query(
        `UPDATE slips
         SET status = 'open', customer_name = NULL, customer_email = NULL,
             customer_phone = NULL, boat_name = NULL, stripe_session_id = NULL,
             reserved_at = NULL
         WHERE stripe_session_id = $1 AND status = 'pending'`,
        [session.id]
      );
    } catch (err) {
      console.error('Failed to release expired slip:', err);
    }
  }

  res.status(200).json({ received: true });
}
