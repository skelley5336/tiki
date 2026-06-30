# Tiki Lee's Airshow Slip Booking

Real-time slip reservation + Stripe payment for Dock C Blue, $75/slip/day.
Friday 7/10, Saturday 7/11, Sunday 7/12.

## How it prevents double-booking

The database has a unique constraint on (slip_number, day). When someone
clicks a slip, the app atomically flips it from 'open' to 'pending' in a
single SQL UPDATE — if two people click the same slip at the same instant,
only one UPDATE succeeds. The slip only becomes permanently 'paid' once
Stripe's webhook confirms the charge actually went through (never trust
the success-page redirect alone — that can be spoofed or interrupted).
Abandoned checkouts auto-release after 15 minutes.

## Setup

### 1. Database
Spin up a free Postgres instance — Supabase or Neon are easiest (free tier,
2-minute setup). Copy the connection string.

Run `schema.sql` against it once (Supabase has a SQL editor for this,
or use `psql $DATABASE_URL -f schema.sql`). This creates the `slips` table
and seeds all 147 rows (49 slips × 3 days).

### 2. Stripe
- Get your **secret key** from Stripe Dashboard > Developers > API keys
- Create a webhook endpoint pointing to `https://YOUR-SITE/api/stripe-webhook`,
  listening for `checkout.session.completed` and `checkout.session.expired`
- Copy the webhook signing secret

### 3. Environment variables
Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SITE_URL` (your deployed domain)

### 4. Install & run
```
npm install
npm run dev
```

### 5. Deploy
Vercel is the simplest (built for Next.js, free tier is plenty for this).
Push to GitHub, import into Vercel, add the same env vars in Vercel's
dashboard, deploy. Then update the Stripe webhook URL to your real domain.

### 6. Embed in the Tiki Lee's site
Once deployed, either:
- Link to it directly from the main site ("Reserve your dock slip" button), or
- Embed it in an iframe on a Webflow page if you want it to feel native

## Testing before going live

Use Stripe **test mode** keys first (`sk_test_...`) and Stripe's test card
`4242 4242 4242 4242` to run through the whole flow — reserve a slip, pay,
confirm it shows as "paid" and disappears from the map for other visitors.
Only swap to live keys once that works end to end.
