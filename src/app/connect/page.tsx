"use client";

import { useState } from "react";

export default function ConnectPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not start onboarding.");
      if (data.connected) {
        setConnected(true);
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Get paid as a seller</h1>
      <p className="mt-1 text-sm text-gray-600">
        Enter the email you use on your listings. After you finish Stripe&apos;s onboarding, every
        listing with that email gets a Buy Now button.
      </p>

      {connected ? (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          This email is already connected. Your listings can be purchased.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seller@example.com"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {busy ? "Redirecting to Stripe…" : "Connect with Stripe"}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs text-gray-500">
        Sandbox mode: use Stripe&apos;s test data for onboarding (see docs.stripe.com/connect/testing).
        No real money moves.
      </p>
    </div>
  );
}
