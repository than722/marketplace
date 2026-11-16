// Registers your webhook endpoint with the Stripe sandbox. Run ONCE after your app is deployed:
//   node --env-file=.env.local scripts/create-webhook.mjs https://YOUR-APP.vercel.app/api/stripe/webhook
import Stripe from "stripe";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node --env-file=.env.local scripts/create-webhook.mjs <public webhook URL>");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpoint = await stripe.webhookEndpoints.create({
  url,
  connect: true, // payments happen on connected accounts, so we need a Connect endpoint
  enabled_events: ["checkout.session.completed", "account.updated"],
});

console.log("Endpoint ID:", endpoint.id);
console.log("Signing secret (shown only once, save it as STRIPE_WEBHOOK_SECRET):", endpoint.secret);
