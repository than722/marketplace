import type Stripe from "stripe";
import { feeFor, normalizeEmail } from "./stripe";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Records the order and marks the listing Sold. Idempotent, so it is safe to call from both
 * the webhook and the success page. Returns the listing id, or null if the session is not
 * one of ours (the sandbox is shared with other candidates) or is not paid.
 */
export async function fulfillSession(session: Stripe.Checkout.Session, accountId: string) {
  const listingId = session.metadata?.listing_id;
  if (!listingId || session.payment_status !== "paid") return null;

  const db = supabaseAdmin();

  const { data: listing } = await db
    .from("listings")
    .select("id,email")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return null;

  // The payment must have gone to the connected account that owns this listing.
  const { data: seller } = await db
    .from("sellers")
    .select("stripe_account_id")
    .eq("email", normalizeEmail(listing.email))
    .maybeSingle();
  if (!seller || seller.stripe_account_id !== accountId) return null;

  const amount = session.amount_total ?? 0;
  const { error: orderErr } = await db.from("orders").upsert(
    {
      stripe_session_id: session.id,
      listing_id: listingId,
      seller_account_id: accountId,
      buyer_email: session.customer_details?.email ?? null,
      amount_total: amount,
      platform_fee: feeFor(amount),
      currency: session.currency ?? "usd",
      status: "paid",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true }
  );
  if (orderErr) throw orderErr;

  const { error: soldErr } = await db.from("listings").update({ sold: true }).eq("id", listingId);
  if (soldErr) throw soldErr;

  return listingId;
}
