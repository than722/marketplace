import Link from "next/link";
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ConnectReturn({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  if (!account) redirect("/connect");

  let ready = false;
  let error: string | null = null;

  try {
    // Ask Stripe directly rather than trusting the redirect.
    const acct = await getStripe().accounts.retrieve(account);
    ready = !!(acct.details_submitted && acct.charges_enabled);
    await supabaseAdmin().from("sellers").update({ onboarded: ready }).eq("stripe_account_id", account);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not check your account.";
  }

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
      {error ? (
        <>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </>
      ) : ready ? (
        <>
          <h1 className="text-xl font-bold">You&apos;re connected 🎉</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your listings now show a Buy Now button, and payouts go to your Stripe account.
          </p>
          <Link href="/" className="mt-4 inline-block text-blue-600 underline">
            View marketplace
          </Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold">Onboarding isn&apos;t finished</h1>
          <p className="mt-2 text-sm text-gray-600">
            Stripe still needs a few details before you can accept payments.
          </p>
          <Link href="/connect" className="mt-4 inline-block text-blue-600 underline">
            Continue onboarding
          </Link>
        </>
      )}
    </div>
  );
}
