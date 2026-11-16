"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IMAGE_BUCKET, supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/types";

const input =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

export default function CreateListing() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    if (!file) return setError("Please choose a photo.");
    if (file.size > 5 * 1024 * 1024) return setError("Photo must be under 5 MB.");

    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

      const { data, error: insErr } = await supabase
        .from("listings")
        .insert({
          title: String(form.get("title")).trim(),
          description: String(form.get("description")).trim(),
          price: Number(form.get("price")),
          email: String(form.get("email")).trim(),
          category: String(form.get("category")),
          image_url: pub.publicUrl,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      router.push(`/listing/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-bold">Create listing</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Photo</label>
          <input type="file" accept="image/*" onChange={onFile} className="text-sm" required />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="mt-2 h-48 rounded-lg object-cover" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input name="title" required maxLength={120} className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea name="description" required rows={4} className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Price (USD)</label>
            <input name="price" type="number" min="0" step="0.01" required className={input} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select name="category" required defaultValue="" className={input}>
              <option value="" disabled>
                Select…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Your email</label>
          <input name="email" type="email" required className={input} />
        </div>

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <button
          disabled={busy}
          className="w-full rounded-lg bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {busy ? "Publishing…" : "Publish listing"}
        </button>
      </form>
    </div>
  );
}
