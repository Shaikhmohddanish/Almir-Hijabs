import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { shopify } from "@/lib/shopify";

export const metadata: Metadata = { title: "Account", description: "Orders, addresses and saved pieces." };

// Accounts are Shopify's hosted customer accounts; this app does not build its own sign-in.
export default function AccountPage() {
  if (shopify.accountUrl && shopify.enabled) redirect(shopify.accountUrl);
  return (
    <main id="main" className="container store-page">
      <h1 className="store-page__title" data-reveal suppressHydrationWarning>Your account</h1>
      <div className="account-grid">
        <section className="account-card" data-reveal suppressHydrationWarning>
          <h2 className="prose__head">Sign in and orders</h2>
          <p className="card__summary">Sign-in, orders and addresses are handled by Shopify customer accounts. This page sends you there once the store is connected.</p>
        </section>
        <section className="account-card" data-reveal suppressHydrationWarning style={{ "--i": 1 } as React.CSSProperties}>
          <h2 className="prose__head">Saved pieces</h2>
          <p className="card__summary">Your wishlist is kept in this browser.</p>
          <p><Link className="link" href="/wishlist">Open the wishlist</Link></p>
        </section>
      </div>
    </main>
  );
}
