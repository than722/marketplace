import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { listingId?: string; buyerEmail?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const listingId = body.listingId?.trim();
  const buyerEmail = body.buyerEmail?.trim();
  const message = body.message?.trim();

  if (!listingId || !buyerEmail || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!EMAIL_RE.test(buyerEmail) || message.length > 2000) {
    return NextResponse.json({ error: "Check your email and message." }, { status: 400 });
  }

  // 1. Look up the listing (we need the seller's email and the title)
  const { data: listing } = await supabase
    .from("listings")
    .select("id,title,email")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  // 2. Save the message. This is the part that must succeed.
  const { error: insErr } = await supabase.from("messages").insert({
    listing_id: listingId,
    buyer_email: buyerEmail,
    message,
  });
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // 3. Email the seller. Best effort: a failure here never loses the saved message.
  let emailed = false;
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "Marketplace <onboarding@resend.dev>",
          to: [listing.email],
          reply_to: buyerEmail,
          subject: `New message about "${listing.title}"`,
          html: `
            <p>Someone is interested in your listing <strong>${esc(listing.title)}</strong>.</p>
            <p><strong>From:</strong> ${esc(buyerEmail)}</p>
            <blockquote style="border-left:3px solid #ccc;margin:0;padding:0 12px;white-space:pre-wrap">${esc(message)}</blockquote>
            <p>Just reply to this email to respond to the buyer.</p>`,
        }),
      });
      emailed = res.ok;
      if (!res.ok) console.error("Resend error:", res.status, await res.text());
    } catch (err) {
      console.error("Resend request failed:", err);
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
