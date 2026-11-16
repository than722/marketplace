import { NextResponse } from "next/server";
import { baseUrl, feeFor, getStripe, normalizeEmail, toCents } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const listingId = String(body.listingId ?? "");
  if (!listingId) {
    return NextResponse.json({ error: "Missing listing." }, { status: 400 });
  }

  try {
    const db = supabaseAdmin();

    const { data: listing } = await db
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (listing.sold) return NextResponse.json({ error: "This item is already sold." }, { status: 409 });

    const { data: seller } = await db
      .from("sellers")
      .select("stripe_account_id,onboarded")
      .eq("email", normalizeEmail(listing.email))
      .maybeSingle();
    if (!seller?.onboarded) {
      return NextResponse.json(
        { error: "This seller has not set up payments yet." },
        { status: 400 }
      );
    }

    const cents = toCents(Number(listing.price));
    if (cents < 50) {
      return NextResponse.json({ error: "Minimum purchase is $0.50." }, { status: 400 });
    }

    const base = baseUrl(req);

    // Direct charge on the seller's connected account, with the platform's application fee.
    const session = await getStripe().checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: cents,
              product_data: {
                name: listing.title,
                ...(listing.image_url ? { images: [listing.image_url] } : {}),
              },
            },
          },
        ],
        payment_intent_data: { application_fee_amount: feeFor(cents) },
        metadata: { listing_id: listing.id },
        success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}&account=${seller.stripe_account_id}`,
        cancel_url: `${base}/listing/${listing.id}`,
      },
      { stripeAccount: seller.stripe_account_id }
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error", err);
    const message = err instanceof Error ? err.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
