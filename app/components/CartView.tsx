"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { shopify } from "@/lib/shopify";
import type { ImageKind, Product } from "../catalog";
import ProductCard from "./ProductCard";
import ProductImage from "./ProductImage";
import { CartNotice, CheckoutButton, useCart } from "./CartProvider";

// `suggestions` are a few niqabs to start from when the bag is empty; the page chooses them.
export default function CartView({ suggestions }: { suggestions: Product[] }) {
  const { lines, count, subtotal, setQty, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="empty">
        <CartNotice />
        <p className="lead">Your bag is empty. Pieces you add from a product page wait here.</p>
        <Link className="btn" href="/collections/niqabs">Shop niqabs</Link>
        <h2 className="prose__head">Start with these</h2>
        <ul className="grid-products">
          {suggestions.map((p) => (
            <ProductCard key={p.handle} product={p} level="h3" />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      <CartNotice />
      <ul className="cart-lines">
        {lines.map((l) => (
          <li className="cart-line" key={l.key}>
            <Link href={`/products/${l.handle}`} className="cart-line__img" tabIndex={-1} aria-hidden="true">
              <ProductImage src={l.image} kind={l.kind as ImageKind | undefined} name={l.name} sizes="96px" />
            </Link>
            <div className="cart-line__text">
              <h2 className="cart-line__name"><Link href={`/products/${l.handle}`}>{l.name}</Link></h2>
              {l.variant && <p className="card__summary">{l.variant}</p>}
              {l.total && <p className="cart-line__price">{formatMoney(l.total)}</p>}
              <button type="button" className="text-btn" onClick={() => remove(l.key)}>Remove</button>
            </div>
            <div className="qty" role="group" aria-label={`Quantity of ${l.name}`}>
              <button type="button" aria-label="One fewer" disabled={l.qty <= 1} onClick={() => setQty(l.key, l.qty - 1)}>−</button>
              <output aria-live="polite">{l.qty}</output>
              <button type="button" aria-label="One more" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="cart-summary">
        <p>
          {count} {count === 1 ? "piece" : "pieces"}.{" "}
          {subtotal ? <>Subtotal: {formatMoney(subtotal)}</> : !shopify.enabled && <>Total: <span className="fill" data-fill="total">prices to be confirmed</span></>}
        </p>
        {subtotal && <p className="card__summary">Shipping and any discount are worked out at checkout.</p>}
        <CheckoutButton />
      </div>
    </>
  );
}
