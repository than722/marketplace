import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { fulfillSession } from "@/lib/fulfill";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 400 });
  }

  // Signature verification needs the raw, unparsed body.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" && event.account) {
      // Events for sessions we don't recognise (shared sandbox) are ignored and still get a 200.
      await fulfillSession(event.data.object as Stripe.Checkout.Session, event.account);
    } else if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const ready = !!(account.details_submitted && account.charges_enabled);
      await supabaseAdmin()
        .from("sellers")
        .update({ onboarded: ready })
        .eq("stripe_account_id", account.id);
    }
  } catch (err) {
    console.error("webhook handler failed", err);
    // A 500 makes Stripe retry later.
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
