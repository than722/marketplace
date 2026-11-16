import Link from "next/link";
import { notFound } from "next/navigation";
import BuyButton from "@/components/BuyButton";
import MessageForm from "@/components/MessageForm";
import { normalizeEmail } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { formatPrice, type Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const l = data as Listing;

  // Only listings from sellers who finished Stripe onboarding can be bought.
  let sellerReady = false;
  try {
    const { data: seller } = await supabaseAdmin()
      .from("sellers")
      .select("onboarded")
      .eq("email", normalizeEmail(l.email))
      .maybeSingle();
    sellerReady = !!seller?.onboarded;
  } catch {
    sellerReady = false;
  }

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to listings
      </Link>
      <div className="grid gap-6 overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-5">
        <div className="relative bg-black md:col-span-3">
          {l.sold && (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white">
              Sold
            </span>
          )}
          {l.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.image_url}
              alt={l.title}
              className="mx-auto max-h-[600px] w-full object-contain"
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-gray-400">No photo</div>
          )}
        </div>
        <div className="space-y-4 p-6 md:col-span-2">
          <div>
            <h1 className="text-2xl font-bold">{l.title}</h1>
            <p className="mt-1 text-xl font-semibold">{formatPrice(l.price)}</p>
            <p className="mt-1 text-xs text-gray-500">
              {l.category} · Listed {new Date(l.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h2 className="mb-1 text-sm font-semibold">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{l.description}</p>
          </div>
          <div>
            <h2 className="mb-1 text-sm font-semibold">Seller</h2>
            <p className="text-sm text-gray-700">{l.email}</p>
          </div>

          {l.sold ? (
            <p className="rounded-lg bg-gray-100 p-3 text-center text-sm font-semibold text-gray-600">
              This item has been sold
            </p>
          ) : sellerReady ? (
            <BuyButton listingId={l.id} />
          ) : (
            <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              Online payment isn&apos;t available for this listing yet. You can still message the
              seller.
            </p>
          )}

          {!l.sold && <MessageForm listingId={l.id} />}
        </div>
      </div>
    </div>
  );
}
