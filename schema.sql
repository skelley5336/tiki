-- Tiki Lee's Airshow Slip Reservations
-- Run this once against your Postgres database (Supabase, Neon, Railway, etc.)

CREATE TABLE IF NOT EXISTS slips (
  id SERIAL PRIMARY KEY,
  slip_number INTEGER NOT NULL CHECK (slip_number BETWEEN 1 AND 49),
  day DATE NOT NULL, -- '2026-07-10', '2026-07-11', or '2026-07-12'
  status TEXT NOT NULL DEFAULT 'open', -- open | pending | paid
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  boat_name TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER DEFAULT 7500,
  reserved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (slip_number, day)
);

-- Index for fast availability lookups
CREATE INDEX IF NOT EXISTS idx_slips_day_status ON slips(day, status);

-- Seed all 49 slips for all 3 days (147 rows total)
INSERT INTO slips (slip_number, day)
SELECT s, d::date
FROM generate_series(1, 49) AS s
CROSS JOIN (VALUES ('2026-07-10'), ('2026-07-11'), ('2026-07-12')) AS days(d)
ON CONFLICT (slip_number, day) DO NOTHING;

-- Optional: a view to auto-expire stale "pending" reservations (older than 15 min)
-- Run this periodically via cron, or check expiry in application code instead.
CREATE OR REPLACE FUNCTION release_stale_pending_slips() RETURNS void AS $$
  UPDATE slips
  SET status = 'open', customer_name = NULL, customer_email = NULL,
      customer_phone = NULL, boat_name = NULL, stripe_session_id = NULL,
      reserved_at = NULL
  WHERE status = 'pending' AND reserved_at < now() - interval '15 minutes';
$$ LANGUAGE sql;
