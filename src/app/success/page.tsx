import Link from "next/link";
import type Stripe from "stripe";
import { fulfillSession } from "@/lib/fulfill";
import { getStripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/types";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; account?: string }>;
}) {
  const { session_id, account } = await searchParams;

  let session: Stripe.Checkout.Session | null = null;
  let title: string | null = null;

  if (session_id && account) {
    try {
      session = await getStripe().checkout.sessions.retrieve(session_id, {}, { stripeAccount: account });
      if (session.payment_status === "paid") {
        // The webhook is the source of truth, but recording here too (idempotent) means the
        // buyer never sees a stale page if the webhook is a few seconds behind.
        await fulfillSession(session, account);
        const listingId = session.metadata?.listing_id;
        if (listingId) {
          const { data } = await supabaseAdmin()
            .from("listings")
            .select("title")
            .eq("id", listingId)
            .maybeSingle();
          title = data?.title ?? null;
        }
      }
    } catch (err) {
      console.error("success page error", err);
    }
  }

  const paid = session?.payment_status === "paid";

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
      {paid ? (
        <>
          <div className="text-4xl">✅</div>
          <h1 className="mt-2 text-2xl font-bold">Payment successful</h1>
          {title && <p className="mt-2 text-gray-700">{title}</p>}
          <p className="mt-1 font-semibold">{formatPrice((session?.amount_total ?? 0) / 100)}</p>
          {session?.customer_details?.email && (
            <p className="mt-1 text-sm text-gray-500">
              Receipt sent to {session.customer_details.email}
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">We couldn&apos;t confirm a payment</h1>
          <p className="mt-2 text-sm text-gray-600">
            If you were charged, the order will appear shortly. Otherwise try again from the listing.
          </p>
        </>
      )}
      <Link href="/" className="mt-6 inline-block text-blue-600 underline">
        Back to the marketplace
      </Link>
    </div>
  );
}
