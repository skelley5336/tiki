// pages/api/slips.js
// GET /api/slips -> returns all slips grouped by day with their status.
// Frontend polls or calls this on load to render the live map.

import { query } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Release any pending reservations older than 15 minutes (abandoned checkouts)
    await query(`
      UPDATE slips
      SET status = 'open', customer_name = NULL, customer_email = NULL,
          customer_phone = NULL, boat_name = NULL, stripe_session_id = NULL,
          reserved_at = NULL
      WHERE status = 'pending' AND reserved_at < now() - interval '15 minutes'
    `);

    const { rows } = await query(`
      SELECT slip_number, day, status
      FROM slips
      ORDER BY day, slip_number
    `);

    res.status(200).json({ slips: rows });
  } catch (err) {
    console.error('GET /api/slips error:', err);
    res.status(500).json({ error: 'Failed to load slips' });
  }
}
