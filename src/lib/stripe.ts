import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    client = new Stripe(key);
  }
  return client;
}

export const PLATFORM_FEE_PERCENT = 10;

export const toCents = (price: number) => Math.round(price * 100);
export const feeFor = (cents: number) => Math.round((cents * PLATFORM_FEE_PERCENT) / 100);

export function baseUrl(req: Request) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return fromEnv || new URL(req.url).origin;
}

export const normalizeEmail = (e: string) => e.trim().toLowerCase();
