// pages/api/create-checkout-session.js
// POST { slipNumber, day, name, email, phone, boatName }
// 1. Atomically claims the slip (status open -> pending) so nobody else can grab it.
// 2. Creates a Stripe Checkout session for $75.
// 3. Returns the checkout URL for the browser to redirect to.

import Stripe from 'stripe';
import { query } from '../../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DAY_LABELS = {
  '2026-07-10': 'Friday 7/10 — Airshow 5pm',
  '2026-07-11': 'Saturday 7/11 — Airshow 5pm',
  '2026-07-12': 'Sunday 7/12 — Airshow 2pm',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slipNumber, day, name, email, phone, boatName } = req.body;

  if (!slipNumber || !day || !name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Atomic claim: only succeeds if the slip is currently 'open'.
    // This is the piece that prevents double-booking.
    const claim = await query(
      `UPDATE slips
       SET status = 'pending',
           customer_name = $1, customer_email = $2,
           customer_phone = $3, boat_name = $4,
           reserved_at = now()
       WHERE slip_number = $5 AND day = $6 AND status = 'open'
       RETURNING id`,
      [name, email, phone, boatName || null, slipNumber, day]
    );

    if (claim.rowCount === 0) {
      return res.status(409).json({
        error: 'That slip was just taken. Please pick another.',
      });
    }

    const slipId = claim.rows[0].id;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 7500,
            product_data: {
              name: `Dock C Blue — Slip ${slipNumber}`,
              description: DAY_LABELS[day] || day,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: { slipId: String(slipId), slipNumber: String(slipNumber), day },
      success_url: `${process.env.SITE_URL}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/?cancelled=1`,
    });

    // Store the session id so the webhook can match it back to this slip
    await query(`UPDATE slips SET stripe_session_id = $1 WHERE id = $2`, [
      session.id,
      slipId,
    ]);

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    res.status(500).json({ error: 'Failed to start checkout' });
  }
}
