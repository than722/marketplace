import Link from "next/link";
import ListingCard from "@/components/ListingCard";
import SearchBox from "@/components/SearchBox";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, type Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category = "All", q = "" } = await searchParams;

  let query = supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (category !== "All") query = query.eq("category", category);
  if (q) {
    // strip characters that have meaning in PostgREST filter syntax
    const safe = q.replace(/[,()%*]/g, " ").trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  const listings = (data ?? []) as Listing[];

  const tabHref = (c: string) => {
    const p = new URLSearchParams();
    if (c !== "All") p.set("category", c);
    if (q) p.set("q", q);
    const s = p.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <div className="space-y-4">
      <SearchBox initialQuery={q} category={category} />

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {["All", ...CATEGORIES].map((c) => (
          <Link
            key={c}
            href={tabHref(c)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
              c === category
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c}
          </Link>
        ))}
      </nav>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Could not load listings: {error.message}
        </p>
      )}

      {!error && listings.length === 0 ? (
        <p className="py-16 text-center text-gray-500">
          No listings found.{" "}
          <Link href="/create" className="text-blue-600 underline">
            Create the first one
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
