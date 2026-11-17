import type { Money, Product } from "@/app/catalog";

// ₹1,299 for whole rupees, ₹1,299.50 otherwise, in the Indian digit grouping.
export function formatMoney(m: Money): string {
  const n = Number(m.amount);
  const digits = Number.isInteger(n) ? 0 : 2;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: m.currencyCode, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

// "₹899", or "From ₹899" when the variants differ in price. Undefined while a product has no price (the local catalogue).
export function priceLabel(p: Pick<Product, "price" | "maxPrice">): string | undefined {
  return p.price ? `${p.maxPrice ? "From " : ""}${formatMoney(p.price)}` : undefined;
}
