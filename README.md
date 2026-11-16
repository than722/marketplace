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

## Notes
- Messages are write-only for anonymous users (RLS has an insert policy but no select policy), so buyers can't read each other's messages. View them in the Supabase Table Editor.

## Email the seller (bonus)
Messages are posted to `/api/message`, which saves the message to Supabase and then emails the seller through [Resend](https://resend.com). The buyer's address is set as Reply-To, so the seller can just hit reply.

1. Create a free Resend account and an API key.
2. Add `RESEND_API_KEY` to `.env.local` and to Vercel's environment variables, then redeploy.
3. Resend's default test sender (`onboarding@resend.dev`) can only deliver to **your own Resend account email**. To email any seller, verify a domain in Resend and set `MAIL_FROM` (e.g. `Marketplace <hello@yourdomain.com>`).

If `RESEND_API_KEY` is missing or the email fails, the message is still saved in Supabase.
