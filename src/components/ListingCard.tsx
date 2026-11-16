import Link from "next/link";
import { formatPrice, type Listing } from "@/lib/types";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square w-full bg-gray-200">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-bold">{formatPrice(listing.price)}</p>
        <p className="truncate text-sm text-gray-700">{listing.title}</p>
        <p className="text-xs text-gray-500">{listing.category}</p>
      </div>
    </Link>
  );
}
