"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({
  initialQuery,
  category,
}: {
  initialQuery: string;
  category: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (category && category !== "All") params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search listings, e.g. bike"
        className="w-full rounded-full border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        Search
      </button>
    </form>
  );
}
