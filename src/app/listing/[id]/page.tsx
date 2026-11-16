import Link from "next/link";
import { notFound } from "next/navigation";
import MessageForm from "@/components/MessageForm";
import { supabase } from "@/lib/supabase";
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

  return (
    <div>
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to listings
      </Link>
      <div className="grid gap-6 overflow-hidden rounded-xl bg-white shadow-sm md:grid-cols-5">
        <div className="bg-black md:col-span-3">
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
          <MessageForm listingId={l.id} />
        </div>
      </div>
    </div>
  );
}
