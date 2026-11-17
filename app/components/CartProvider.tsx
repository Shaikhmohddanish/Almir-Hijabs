"use client";

import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Money } from "@/app/catalog";
import { cartApi, shopify, type CartResult } from "@/lib/shopify";
import { cartLines, type CartLine } from "@/lib/shopify-map";

export type { CartLine } from "@/lib/shopify-map";

// The bag is Shopify's cart (Cart API, hosted checkout) once the store is connected; until then it lives in this browser.
// The wishlist stays in the browser: Shopify has no wishlist of its own.
type Store = {
  lines: CartLine[];
  count: number;
  // What the pieces cost together, before shipping and any discount, which Shopify works out at checkout.
  subtotal?: Money;
  checkoutUrl?: string;
  // Something the shopper should hear about the last change: sold out, fewer left, no connection.
  notice: string | null;
  dismissNotice: () => void;
  // Resolves to true when the piece went in as asked, false when Shopify said otherwise (the notice says what).
  add: (line: Omit<CartLine, "key" | "qty">, from?: Element | null) => Promise<boolean>;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  drawer: boolean;
  setDrawer: (open: boolean) => void;
  wish: string[];
  toggleWish: (handle: string) => void;
};

const StoreContext = createContext<Store | null>(null);
const CART_ID = "almira-cart-id";
const OFFLINE = "The bag couldn't reach the shop. Check your connection and try again.";

function useSaved<T>(key: string, empty: T) {
  const [value, setValue] = useState<T>(empty);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

// A dot that flies from the button to the bag icon, then the icon gives a small bump.
function flyToBag(from?: Element | null) {
  const bag = document.getElementById("bag-button");
  if (!bag || !from || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const a = from.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.className = "fly-dot";
  dot.style.left = `${a.left + a.width / 2}px`;
  dot.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  dot
    .animate(
      [
        { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3 - 80}px)) scale(1.2)`, opacity: 1, offset: 0.3 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.4)`, opacity: 0.6 },
      ],
      { duration: 700, easing: "cubic-bezier(0.5, 0, 0.3, 1)" },
    )
    .finished.then(() => {
      dot.remove();
      bag.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useSaved<CartLine[]>("almira-bag", []);
  const [wish, setWish] = useSaved<string[]>("almira-wishlist", []);
  const [drawer, setDrawer] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>();
  const [subtotal, setSubtotal] = useState<Money>();
  const [notice, setNotice] = useState<string | null>(null);

  // Shopify's answer replaces the bag, and its messages (sold out, fewer left) become the notice.
  // No cart in the answer means the one this browser held is gone, so the next add starts a new one.
  const sync = useCallback(
    (r: CartResult) => {
      if (r.cart) {
        window.localStorage.setItem(CART_ID, r.cart.id);
        setLines(cartLines(r.cart));
        setCheckoutUrl(r.cart.checkoutUrl);
        setSubtotal(r.cart.cost.subtotalAmount);
      } else if (r.errors.length) {
        window.localStorage.removeItem(CART_ID);
        setLines([]);
        setCheckoutUrl(undefined);
        setSubtotal(undefined);
      }
      setNotice(r.errors[0] ?? null);
    },
    [setLines],
  );
  const send = useCallback(
    (call: Promise<CartResult>) =>
      call
        .then((r) => {
          sync(r);
          return r.errors.length === 0;
        })
        .catch(() => {
          setNotice(OFFLINE);
          return false;
        }),
    [sync],
  );

  // Restore the Shopify cart this browser started earlier. Lines saved before the store was connected can't be checked out, so they go.
  useEffect(() => {
    if (!shopify.enabled) return;
    const id = window.localStorage.getItem(CART_ID);
    if (!id) {
      setLines([]);
      return;
    }
    cartApi
      .get(id)
      .then((cart) => {
        if (cart) sync({ cart, errors: [] });
        else {
          window.localStorage.removeItem(CART_ID);
          setLines([]);
        }
      })
      .catch(() => {});
  }, [sync, setLines]);

  const add = useCallback(
    async (line: Omit<CartLine, "key" | "qty">, from?: Element | null) => {
      // The dot flies and the bag opens at once; if Shopify then objects, the bag shows its message.
      const show = () => {
        flyToBag(from);
        window.setTimeout(() => setDrawer(true), from ? 650 : 0);
      };
      if (!shopify.enabled) {
        const key = `${line.handle}:${line.variant ?? ""}`;
        setLines((old) => {
          const hit = old.find((l) => l.key === key);
          return hit ? old.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l)) : [...old, { ...line, key, qty: 1 }];
        });
        show();
        return true;
      }
      // With the store connected a piece is bought through its Shopify variant; one without cannot be, and is never kept locally.
      if (!line.merchandiseId) {
        setNotice("This piece can't be added to the bag yet.");
        setDrawer(true);
        return false;
      }
      const id = window.localStorage.getItem(CART_ID);
      show();
      return send(id ? cartApi.add(id, line.merchandiseId) : cartApi.create(line.merchandiseId));
    },
    [send, setLines],
  );
  const setQty = useCallback(
    (key: string, qty: number) => {
      const id = window.localStorage.getItem(CART_ID);
      if (shopify.enabled && id && key.startsWith("gid://")) send(cartApi.update(id, key, Math.max(1, qty)));
      else setLines((old) => old.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l)));
    },
    [send, setLines],
  );
  const remove = useCallback(
    (key: string) => {
      const id = window.localStorage.getItem(CART_ID);
      if (shopify.enabled && id && key.startsWith("gid://")) send(cartApi.remove(id, key));
      else setLines((old) => old.filter((l) => l.key !== key));
    },
    [send, setLines],
  );
  const toggleWish = useCallback((handle: string) => setWish((old) => (old.includes(handle) ? old.filter((h) => h !== handle) : [...old, handle])), [setWish]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({ lines, count: lines.reduce((n, l) => n + l.qty, 0), subtotal, checkoutUrl, notice, dismissNotice, add, setQty, remove, drawer, setDrawer, wish, toggleWish }),
    [lines, subtotal, checkoutUrl, notice, dismissNotice, add, setQty, remove, drawer, wish, toggleWish],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCart() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useCart needs CartProvider");
  return store;
}

// Checkout is Shopify's hosted checkout: the bag hands over to it.
export function CheckoutButton({ className = "btn" }: { className?: string }) {
  const { checkoutUrl, count } = useCart();
  if (checkoutUrl && count > 0) {
    return (
      <a className={className} href={checkoutUrl}>
        Checkout
      </a>
    );
  }
  return (
    <>
      <button type="button" className={className} disabled aria-describedby={shopify.enabled ? undefined : "checkout-note"}>
        Checkout
      </button>
      {!shopify.enabled && <p id="checkout-note" className="card__summary">Checkout opens on Shopify once the store is connected; nothing is charged here.</p>}
    </>
  );
}

// What Shopify said about the last change to the bag, until the shopper dismisses it or the next change replaces it.
export function CartNotice() {
  const { notice, dismissNotice } = useCart();
  if (!notice) return null;
  return (
    <p className="cart-notice" role="alert">
      <span>{notice}</span>
      <button type="button" className="text-btn" onClick={dismissNotice}>
        Dismiss
      </button>
    </p>
  );
}

export function BagButton() {
  const { count, setDrawer } = useCart();
  return (
    <button type="button" id="bag-button" className="icon-link" aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`} onClick={() => setDrawer(true)}>
      <ShoppingBag size={20} strokeWidth={1.5} aria-hidden="true" />
      {count > 0 && <span className="icon-link__count" aria-hidden="true">{count}</span>}
    </button>
  );
}

export function WishlistLink() {
  const { wish } = useCart();
  return (
    <Link href="/wishlist" className="icon-link" aria-label={`Wishlist, ${wish.length} saved`}>
      <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
      {wish.length > 0 && <span className="icon-link__count" aria-hidden="true">{wish.length}</span>}
    </Link>
  );
}

export function WishlistButton({ handle, name, className = "" }: { handle: string; name: string; className?: string }) {
  const { wish, toggleWish } = useCart();
  const saved = wish.includes(handle);
  return (
    <button
      type="button"
      className={`heart ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWish(handle);
      }}
    >
      <Heart size={18} strokeWidth={1.5} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
