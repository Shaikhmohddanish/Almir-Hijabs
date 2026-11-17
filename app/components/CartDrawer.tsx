"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { lockScroll } from "@/lib/scroll-lock";
import { useEffect, useRef } from "react";
import type { ImageKind } from "../catalog";
import ProductImage from "./ProductImage";
import { CartNotice, CheckoutButton, useCart } from "./CartProvider";

// The bag slides in from the right after an add, or from the header's bag button.
export default function CartDrawer() {
  const { lines, count, subtotal, setQty, remove, drawer, setDrawer } = useCart();
  const close = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Following a link from the bag closes it.
  useEffect(() => setDrawer(false), [pathname, setDrawer]);

  useEffect(() => {
    if (!drawer) return;
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [drawer, setDrawer]);

  return (
    <div className="drawer" data-open={drawer} aria-hidden={!drawer} inert={!drawer}>
      <div className="drawer__scrim" onClick={() => setDrawer(false)} />
      <aside className="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">Your bag ({count})</h2>
          <button ref={close} type="button" className="icon-btn" aria-label="Close the bag" onClick={() => setDrawer(false)}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        {lines.length === 0 ? (
          <p className="drawer__empty">Nothing here yet. Add a piece from any product page.</p>
        ) : (
          <ul className="drawer__lines">
            {lines.map((l, i) => (
              <li key={l.key} className="drawer__line" style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/products/${l.handle}`} className="drawer__img" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={l.image} kind={l.kind as ImageKind | undefined} name={l.name} sizes="72px" />
                </Link>
                <div className="drawer__text">
                  <Link href={`/products/${l.handle}`} className="drawer__name">{l.name}</Link>
                  {l.variant && <span className="card__summary">{l.variant}</span>}
                  {l.total && <span className="drawer__price">{formatMoney(l.total)}</span>}
                  <div className="drawer__row">
                    <div className="qty qty--sm" role="group" aria-label={`Quantity of ${l.name}`}>
                      <button type="button" aria-label="One fewer" disabled={l.qty <= 1} onClick={() => setQty(l.key, l.qty - 1)}>−</button>
                      <output>{l.qty}</output>
                      <button type="button" aria-label="One more" onClick={() => setQty(l.key, l.qty + 1)}>+</button>
                    </div>
                    <button type="button" className="text-btn" onClick={() => remove(l.key)}>Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="drawer__foot">
          <CartNotice />
          {subtotal && lines.length > 0 && (
            <>
              <p className="drawer__total"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></p>
              <p className="card__summary">Shipping and any discount are worked out at checkout.</p>
            </>
          )}
          <CheckoutButton className="btn drawer__cta" />
          <Link className="link" href="/cart">View bag</Link>
        </div>
      </aside>
    </div>
  );
}
