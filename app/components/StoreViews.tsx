"use client";

import Link from "next/link";
import type { Product } from "../catalog";
import { useCart } from "./CartProvider";
import ProductCard from "./ProductCard";

// `products` is the whole shop, cut down to what a card shows; the wishlist keeps only handles, in this browser.
export function WishlistView({ products }: { products: Product[] }) {
  const { wish } = useCart();
  const saved = wish.flatMap((h) => products.find((p) => p.handle === h) ?? []);
  if (saved.length === 0) {
    return (
      <div className="empty">
        <p className="lead">Nothing saved yet. Tap the heart on any piece to keep it here.</p>
        <Link className="btn" href="/collections/niqabs">Browse the niqabs</Link>
      </div>
    );
  }
  return (
    <ul className="grid-products">
      {saved.map((p, i) => (
        <ProductCard key={p.handle} product={p} index={i} />
      ))}
    </ul>
  );
}
