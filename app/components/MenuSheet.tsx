"use client";

import { ArrowRight, Heart, ShoppingBag, User, X } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useDragControls, type Variants } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import type { ImageKind } from "../catalog";
import { useCart } from "./CartProvider";
import ProductImage from "./ProductImage";

export type MenuCollection = { id: string; name: string; href: string; count?: number; image?: string; kind?: ImageKind };

const SUGGESTIONS = ["Search niqabs", "Try gold embroidery", "A lace undercap", "Design A18", "Crushed satin hijabs"];
const rise: Variants = { hidden: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 34 } } };
const list: Variants = { shown: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } };

// The phone and tablet menu: a full-screen sheet with search, the collections, and the account shortcuts.
// It slides in on a spring, its items rise one after another, and a swipe to the left closes it.
export default function MenuSheet({ open, onClose, onDismiss, accountHref, collections }: { open: boolean; onClose: () => void; onDismiss: () => void; accountHref: string; collections: MenuCollection[] }) {
  const { count, wish, setDrawer } = useCart();
  const router = useRouter();
  const controls = useDragControls();
  const [q, setQ] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  // The typed words dissolve first, then the results page opens.
  const search = () => {
    const term = q.trim();
    if (!term) return;
    window.setTimeout(() => {
      onClose();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }, 700);
  };
  const swipe = (e: PointerEvent) => controls.start(e);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div key="sheet" className="sheet" role="dialog" aria-modal="true" aria-label="Menu" exit={{ opacity: 1 }} transition={{ duration: 0.32 }}>
            <motion.div className="sheet__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onDismiss} />
            <motion.div
              className="sheet__panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              drag="x"
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -90 || info.velocity.x < -450) onDismiss();
              }}
            >
              <div className="sheet__head" onPointerDown={swipe}>
                <span className="wordmark">Almir Hijabs</span>
                <button ref={closeRef} type="button" className="icon-btn" aria-label="Close the menu" onClick={onDismiss}>
                  <X size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <div className="sheet__search">
                <PlaceholdersAndVanishInput placeholders={SUGGESTIONS} label="Search the shop" onChange={(e) => setQ(e.target.value)} onSubmit={search} />
              </div>
              <motion.div className="sheet__scroll" initial="hidden" animate="shown" variants={list} onPointerDown={swipe}>
                <motion.ul className="sheet__links" variants={list}>
                  {collections.map((c) => (
                    <motion.li key={c.id} variants={rise}>
                      <Link href={c.href} className="sheet__link" onClick={onClose}>
                        <span className="sheet__text">
                          <span className="sheet__name">{c.name}</span>
                          {c.count !== undefined && <span className="sheet__meta">{c.count} styles</span>}
                        </span>
                        <span className="sheet__thumb">
                          <ProductImage src={c.image} kind={c.kind} name={c.name} sizes="56px" />
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                  <motion.li variants={rise}>
                    <Link href="/#lookbook" className="sheet__link" onClick={onClose}>
                      <span className="sheet__text">
                        <span className="sheet__name">Try the look</span>
                        <span className="sheet__meta">Eight niqabs, styled</span>
                      </span>
                      <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
                    </Link>
                  </motion.li>
                </motion.ul>
                <motion.ul className="sheet__tiles" variants={rise}>
                  <li>
                    <Link href="/wishlist" className="sheet__tile" onClick={onClose}>
                      <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
                      <span>Wishlist{wish.length > 0 ? ` (${wish.length})` : ""}</span>
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="sheet__tile"
                      onClick={() => {
                        onClose();
                        setDrawer(true);
                      }}
                    >
                      <ShoppingBag size={20} strokeWidth={1.5} aria-hidden="true" />
                      <span>Bag{count > 0 ? ` (${count})` : ""}</span>
                    </button>
                  </li>
                  <li>
                    <Link href={accountHref} className="sheet__tile" onClick={onClose}>
                      <User size={20} strokeWidth={1.5} aria-hidden="true" />
                      <span>Account</span>
                    </Link>
                  </li>
                </motion.ul>
                <motion.ul className="sheet__foot" variants={rise}>
                  <li><Link href="/about" onClick={onClose}>About</Link></li>
                  <li><Link href="/contact" onClick={onClose}>Contact</Link></li>
                  <li><Link href="/policies/shipping" onClick={onClose}>Shipping</Link></li>
                  <li><Link href="/policies/returns" onClick={onClose}>Returns</Link></li>
                </motion.ul>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
