import { NextResponse } from "next/server";
import { baseUrl, getStripe, normalizeEmail } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ""));
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const db = supabaseAdmin();

    const { data: seller } = await db
      .from("sellers")
      .select("stripe_account_id")
      .eq("email", email)
      .maybeSingle();

    let accountId = seller?.stripe_account_id as string | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      const { error } = await db
        .from("sellers")
        .insert({ email, stripe_account_id: accountId });
      if (error) throw error;
    } else {
      // Returning seller: skip onboarding if they already finished it.
      const account = await stripe.accounts.retrieve(accountId);
      if (account.details_submitted && account.charges_enabled) {
        await db.from("sellers").update({ onboarded: true }).eq("email", email);
        return NextResponse.json({ connected: true });
      }
    }

    const base = baseUrl(req);
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${base}/connect?refresh=1`,
      return_url: `${base}/connect/return?account=${accountId}`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("connect error", err);
    const message = err instanceof Error ? err.message : "Could not start onboarding.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
