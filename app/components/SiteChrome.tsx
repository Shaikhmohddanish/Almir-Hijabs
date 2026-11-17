import Link from "next/link";
import { Search, User } from "lucide-react";
import { menuCollections } from "@/lib/commerce";
import { shopify } from "@/lib/shopify";
import { site } from "@/lib/site";
import { BagButton, WishlistLink } from "./CartProvider";
import MobileMenu from "./MobileMenu";

// Accounts are Shopify's hosted customer accounts once the store is connected.
const accountHref = shopify.enabled && shopify.accountUrl ? shopify.accountUrl : "/account";

export async function SiteHeader() {
  // The menu's collection rows: the real counts and one photograph each.
  const menu = await menuCollections();
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="masthead">
        <div className="container masthead__inner">
          <div className="masthead__start">
          <MobileMenu accountHref={accountHref} collections={menu} />
          <ul className="masthead__links masthead__links--start">
            <li><Link href="/collections/hijabs">Hijabs</Link></li>
            <li><Link href="/collections/niqabs">Niqabs</Link></li>
            <li><Link href="/collections/undercaps">Undercaps</Link></li>
            <li><Link href="/#lookbook">Lookbook</Link></li>
          </ul>
          </div>
          <Link className="wordmark" href="/" aria-label="Almir Hijabs, home">
            Almir Hijabs
          </Link>
          <div className="masthead__icons">
            <Link href="/search" className="icon-link" aria-label="Search">
              <Search size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link href={accountHref} className="icon-link" aria-label="Account">
              <User size={20} strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <WishlistLink />
            <BagButton />
          </div>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="grid-12">
          <div className="footer__brand" data-reveal suppressHydrationWarning>
            <p className="wordmark">Almir Hijabs</p>
            <p>Niqabs, hijabs and undercaps.</p>
          </div>
          <div className="footer__col" data-reveal suppressHydrationWarning style={{ "--i": 1 } as React.CSSProperties}>
            <h2 className="footer__head">Shop</h2>
            <ul className="footer__list">
              <li><Link href="/collections/hijabs">Hijabs</Link></li>
              <li><Link href="/collections/niqabs">Niqabs</Link></li>
              <li><Link href="/collections/undercaps">Undercaps</Link></li>
              <li><Link href="/search">Search</Link></li>
            </ul>
          </div>
          <div className="footer__col" data-reveal suppressHydrationWarning style={{ "--i": 2 } as React.CSSProperties}>
            <h2 className="footer__head">Help</h2>
            <ul className="footer__list">
              <li><Link href="/policies/shipping">Shipping</Link></li>
              <li><Link href="/policies/returns">Returns</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              {site.whatsapp && <li><a href={`https://wa.me/${site.whatsapp}`}>WhatsApp</a></li>}
              {site.instagram && <li><a href={site.instagram}>Instagram</a></li>}
            </ul>
          </div>
          <div className="footer__col" data-reveal suppressHydrationWarning style={{ "--i": 3 } as React.CSSProperties}>
            <h2 className="footer__head">Account</h2>
            <ul className="footer__list">
              <li><Link href={accountHref}>My account</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
              <li><Link href="/cart">Bag</Link></li>
              <li><Link href="/about">About</Link></li>
            </ul>
          </div>
        </div>
        <p className="footer__legal">
          <span>© 2026 Almir Hijabs</span>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
        </p>
      </div>
    </footer>
  );
}
