// Shopify Storefront API. The public access token is meant for browsers (Headless channel in the Shopify admin).
// Until the store exists these are unset and the site runs on the local catalogue (app/catalog.ts).
import type { ShopifyCart } from "./shopify-map";
import { CART_ADD, CART_CREATE, CART_GET, CART_REMOVE, CART_UPDATE } from "./shopify-queries";

export type { ShopifyCart } from "./shopify-map";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION || "2026-10";

export const shopify = {
  enabled: Boolean(domain && token),
  // Shopify's hosted customer accounts: sign-in, orders and addresses live there, not in this app.
  accountUrl: domain ? `https://${domain}/account` : undefined,
};

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  if (!shopify.enabled) throw new Error("Shopify is not configured");
  const res = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token! },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length) throw new Error(json.errors?.map((e) => e.message).join("; ") || `Shopify ${res.status}`);
  return json.data as T;
}

// What a cart call gives back: the cart as it now stands, and anything Shopify wants the shopper told (sold out, fewer left).
export type CartResult = { cart: ShopifyCart | null; errors: string[] };
type Payload = { cart: ShopifyCart | null; userErrors: { message: string }[]; warnings: { message: string }[] };
const result = (p: Payload): CartResult => ({ cart: p.cart, errors: [...p.userErrors, ...p.warnings].map((e) => e.message) });

// Cart API: Shopify owns the cart and its checkout; the app only shows it.
export const cartApi = {
  get: (id: string) => storefront<{ cart: ShopifyCart | null }>(CART_GET, { id }).then((d) => d.cart),
  create: (merchandiseId: string) => storefront<{ cartCreate: Payload }>(CART_CREATE, { lines: [{ merchandiseId, quantity: 1 }] }).then((d) => result(d.cartCreate)),
  add: (cartId: string, merchandiseId: string) => storefront<{ cartLinesAdd: Payload }>(CART_ADD, { cartId, lines: [{ merchandiseId, quantity: 1 }] }).then((d) => result(d.cartLinesAdd)),
  update: (cartId: string, id: string, quantity: number) => storefront<{ cartLinesUpdate: Payload }>(CART_UPDATE, { cartId, lines: [{ id, quantity }] }).then((d) => result(d.cartLinesUpdate)),
  remove: (cartId: string, id: string) => storefront<{ cartLinesRemove: Payload }>(CART_REMOVE, { cartId, lineIds: [id] }).then((d) => result(d.cartLinesRemove)),
};
