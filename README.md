# Marketplace

A mini Facebook-style marketplace built with Next.js 15, React 19, Tailwind CSS and Supabase (Postgres + Storage). No login required.

## Features
- **Create listing**: photo upload (Supabase Storage), title, description, price, email, category
- **Browse**: responsive grid, category tabs, keyword search (bonus)
- **Listing page**: photo, full details, seller email
- **Message Seller**: saves the buyer's email + message to the `messages` table

## Setup
1. Create a project at supabase.com.
2. Open **SQL Editor**, paste `supabase/schema.sql`, and run it. This creates the `listings` and `messages` tables, RLS policies, and a public `listing-images` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in your values (Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Install and run:
   ```
   npm install
   npm run dev
   ```

## Deploy to Vercel
1. Push this repo to a **public** GitHub repository.
2. Import it at vercel.com/new.
3. Add the two environment variables above in Project Settings → Environment Variables.
4. Deploy. Submit the **production** URL (not a preview URL).

## Stripe Connect (Test 4)
Sandbox only. Sellers onboard with Stripe Express; buyers pay with Stripe Checkout; the platform keeps a 10% fee (`PLATFORM_FEE_PERCENT` in `src/lib/stripe.ts`).

- **Seller onboarding** (`/connect`): the seller enters the email used on their listings and completes Stripe's hosted onboarding. The connected account ID is saved in the `sellers` table.
- **Buy Now**: shown only for unsold listings whose seller email has an onboarded account. It creates a Checkout Session as a *direct charge* on the seller's connected account with an `application_fee_amount`.
- **Order confirmation**: a Connect webhook (`/api/stripe/webhook`, `checkout.session.completed`) records the order in `orders` and marks the listing Sold. The success page does the same idempotently, so it never lags behind the webhook.
- The webhook ignores events it doesn't recognise (the sandbox is shared) and returns 200.

Setup:
1. Run `supabase/stripe.sql` in the Supabase SQL Editor (after `schema.sql`).
2. Add `SUPABASE_SERVICE_ROLE_KEY` and the Stripe keys to `.env.local` and Vercel. Never commit them.
3. Deploy, then register the webhook once:
   `node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app/api/stripe/webhook`
4. Save the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy.
5. Test card: `4242 4242 4242 4242`, any future expiry, any CVC and ZIP.

## Notes
- `sellers` and `orders` have row level security enabled with no public policies; only server routes using the service role key can read or write them.
- Messages are write-only for anonymous users (RLS has an insert policy but no select policy), so buyers can't read each other's messages. View them in the Supabase Table Editor.

## Email the seller (bonus)
Messages are posted to `/api/message`, which saves the message to Supabase and then emails the seller through [Resend](https://resend.com). The buyer's address is set as Reply-To, so the seller can just hit reply.

1. Create a free Resend account and an API key.
2. Add `RESEND_API_KEY` to `.env.local` and to Vercel's environment variables, then redeploy.
3. Resend's default test sender (`onboarding@resend.dev`) can only deliver to **your own Resend account email**. To email any seller, verify a domain in Resend and set `MAIL_FROM` (e.g. `Marketplace <hello@yourdomain.com>`).

If `RESEND_API_KEY` is missing or the email fails, the message is still saved in Supabase.
