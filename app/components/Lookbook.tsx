"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play, Plus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { lockScroll } from "@/lib/scroll-lock";
import { imageOf, lookPairing, type Look, type Product } from "../catalog";
import { useCart, WishlistButton } from "./CartProvider";
import ProductImage from "./ProductImage";

const INTERVAL = 5200;
const pad = (n: number) => String(n).padStart(2, "0");

// "Try the look": a row of looks receding into soft depth. Drag it, step through it, or let it play;
// open the front look to shop its pieces.
// Performance: positions are written straight to the figures (no React render per pointer move),
// and depth blur is a fade to a pre-blurred copy, so only transform and opacity ever change.
// `pieces` holds the products the looks are made of, by handle; the page reads them from the shop.
export default function Lookbook({ looks, pieces }: { looks: Look[]; pieces: Record<string, Product> }) {
  const n = looks.length;
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const figs = useRef<(HTMLElement | null)[]>([]);
  const softs = useRef<(HTMLElement | null)[]>([]);
  const sharps = useRef<(HTMLElement | null)[]>([]);
  const ptr = useRef({ id: -1, x: 0, moved: false, v: 0, lastX: 0, lastT: 0, offset: 0, raf: 0 });
  const activeRef = useRef(0);
  activeRef.current = active;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPaused(true);
  }, []);

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);
  const spacing = () => {
    const w = stage.current?.clientWidth ?? 1200;
    return w < 640 ? w * 0.46 : Math.min(w * 0.2, 320);
  };

  // Place every figure for a (possibly fractional) position in the row.
  const layout = useCallback(
    (pos: number) => {
      const sp = spacing();
      for (let i = 0; i < n; i++) {
        const el = figs.current[i];
        if (!el) continue;
        let o = (((i - pos) % n) + n) % n;
        if (o >= n / 2) o -= n;
        const d = Math.min(Math.abs(o), 3.5);
        el.style.transform = `translate3d(calc(-50% + ${(o * sp).toFixed(1)}px), ${(-d * 3).toFixed(2)}%, 0) scale(${(1 - d * 0.14).toFixed(3)})`;
        el.style.opacity = Math.abs(o) > 3.4 ? "0" : (1 - Math.min(d, 3) * 0.18).toFixed(3);
        el.style.visibility = Math.abs(o) > 3.6 ? "hidden" : "visible";
        el.style.zIndex = String(100 - Math.round(d * 10));
        const blur = Math.min(d, 1);
        const sharp = sharps.current[i];
        const soft = softs.current[i];
        if (sharp) sharp.style.opacity = (1 - blur).toFixed(3);
        if (soft) soft.style.opacity = blur.toFixed(3);
      }
    },
    [n],
  );

  useLayoutEffect(() => {
    layout(active);
    const onResize = () => layout(activeRef.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active, layout]);


  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const now = performance.now();
    ptr.current = { ...ptr.current, id: e.pointerId, x: e.clientX, moved: false, v: 0, lastX: e.clientX, lastT: now, offset: 0 };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = ptr.current;
    if (s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (!s.moved && Math.abs(dx) > 6) {
      s.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!s.moved) return;
    const now = performance.now();
    s.v = (e.clientX - s.lastX) / Math.max(1, now - s.lastT);
    s.lastX = e.clientX;
    s.lastT = now;
    s.offset = -dx / spacing();
    if (!s.raf) s.raf = requestAnimationFrame(() => { s.raf = 0; layout(activeRef.current + s.offset); });
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = ptr.current;
    if (s.id !== e.pointerId) return;
    s.id = -1;
    if (s.moved) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      const flick = Math.abs(s.v) > 0.45 ? (s.v < 0 ? 0.5 : -0.5) : 0;
      const target = (((Math.round(active + s.offset + flick)) % n) + n) % n;
      setDragging(false);
      if (target === active) layout(active);
      else go(target);
      return;
    }
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-look]");
    if (!el) return;
    const i = Number(el.dataset.look);
    if (i === active) setOpen(i);
    else go(i);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); setOpen(active); }
  };

  const held = paused || holding || dragging || open !== null;

  return (
    <div
      className={`tryon${dragging ? " is-dragging" : ""}`}
      data-held={held}
      style={{ "--interval": `${INTERVAL}ms` } as CSSProperties}
      onPointerEnter={() => setHolding(true)}
      onPointerLeave={() => setHolding(false)}
      onFocus={() => setHolding(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHolding(false); }}
    >
      <div
        ref={stage}
        className="tryon__stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Try the look"
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { ptr.current.id = -1; setDragging(false); layout(active); }}
        onKeyDown={onKey}
      >
        {looks.map((l, i) => (
          <figure
            key={l.src}
            ref={(el) => { figs.current[i] = el; }}
            className="tryon__figure"
            data-look={i}
            aria-hidden={i !== active}
            style={{ "--start": i <= n / 2 ? i : i - n } as CSSProperties}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={(el) => { softs.current[i] = el; }} className="tryon__soft" src={l.soft} alt="" width={300} height={300} loading="lazy" decoding="async" draggable={false} />
            <Image
              ref={(el) => { sharps.current[i] = el; }}
              className="tryon__sharp"
              src={l.src}
              alt={i === active ? l.alt : ""}
              fill
              sizes="(max-width: 40rem) 72vw, 34vw"
              draggable={false}
              loading={Math.abs(i <= n / 2 ? i : i - n) <= 1 ? "eager" : "lazy"}
            />
            <span className="tryon__shadow" aria-hidden="true" />
          </figure>
        ))}

        <p className="visually-hidden" aria-live="polite">
          Look {active + 1} of {n}: {looks[active].title}
        </p>
      </div>

      <div className="tryon__bar container">
        <button type="button" className="tryon__arrow" aria-label="Previous look" onClick={() => go(active - 1)}>
          <ArrowLeft size={22} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <ol className="tryon__steps">
          {looks.map((l, i) => (
            <li key={l.src} className={i === active ? "is-active" : undefined}>
              <button type="button" className="tryon__step" aria-current={i === active} aria-label={`Look ${i + 1}: ${l.title}`} onClick={() => go(i)}>
                <span className="tryon__step-bar"><i onAnimationEnd={() => i === active && go(active + 1)} /></span>
                <span className="tryon__step-n">{pad(i + 1)}</span>
                {i === active && <span className="tryon__step-label">{l.step}</span>}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="tryon__arrow" aria-label={paused ? "Play the looks" : "Pause the looks"} onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={16} strokeWidth={1.5} fill="currentColor" aria-hidden="true" /> : <Pause size={16} strokeWidth={1.5} aria-hidden="true" />}
        </button>
        <button type="button" className="tryon__arrow" aria-label="Next look" onClick={() => go(active + 1)}>
          <ArrowRight size={22} strokeWidth={1.25} aria-hidden="true" />
        </button>
      </div>

      <LookPieces look={looks[active]} pieces={pieces} />

      {open !== null && <LookDetail look={looks[open]} pieces={pieces} index={open} total={n} onClose={() => setOpen(null)} />}
    </div>
  );
}

// A look is a niqab and the undercap it is paired with. A piece the shop doesn't have is left out.
function piecesOf(look: Look, pieces: Record<string, Product>) {
  return [pieces[look.handle], pieces[lookPairing]].filter((p): p is Product => p !== undefined);
}

function LookDetail({ look, pieces, index, total, onClose }: { look: Look; pieces: Record<string, Product>; index: number; total: number; onClose: () => void }) {
  const { add } = useCart();
  const items = piecesOf(look, pieces);
  const close = useRef<HTMLButtonElement>(null);
  const [lit, setLit] = useState<number | null>(null);

  useEffect(() => {
    close.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => lockScroll(), []);

  const addItem = (k: number, from: Element | null) => {
    const p = items[k];
    add({ handle: p.handle, name: p.name, variant: p.variants?.[0]?.name, image: imageOf(p), kind: p.kind, merchandiseId: p.variants?.[0]?.id ?? p.variantId }, from);
  };

  return (
    <div className="look" role="dialog" aria-modal="true" aria-labelledby="look-title">
      <div className="look__stage">
        <div className="look__head">
          <h2 id="look-title" className="look__title">{look.title}</h2>
          <p className="card__summary">Look {pad(index + 1)} of {pad(total)}</p>
        </div>
        <button ref={close} type="button" className="look__close" aria-label="Close the look" onClick={onClose}>
          <X size={20} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <div className="look__figure">
          <Image src={look.src} alt={look.alt} fill sizes="(max-width: 60rem) 90vw, 52vw" />
          {look.pins.map((pin, k) => (
            <button
              key={pin.label}
              type="button"
              className="pin"
              data-lit={lit === k}
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, "--i": k } as CSSProperties}
              aria-label={`${k + 1}: ${pin.label}`}
              onPointerEnter={() => setLit(k)}
              onPointerLeave={() => setLit(null)}
              onFocus={() => setLit(k)}
              onBlur={() => setLit(null)}
              onClick={() => document.getElementById(`look-item-${k}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })}
            >
              {k + 1}
            </button>
          ))}
        </div>
      </div>
      <aside className="look__panel">
        <h3 className="look__panel-title">In this look</h3>
        <ul className="look__items">
          {items.map((p, k) => (
            <li key={p.handle} id={`look-item-${k}`} className="look__item" data-lit={lit === k} style={{ "--i": k } as CSSProperties}>
              <Link href={`/products/${p.handle}`} className="look__thumb">
                <ProductImage src={imageOf(p)} kind={p.kind} name={p.name} sizes="112px" />
                <span className="look__num" aria-hidden="true">{k + 1}</span>
              </Link>
              <div className="look__text">
                <Link href={`/products/${p.handle}`} className="look__name">{p.name}</Link>
                <span className="card__summary">{k === 0 ? p.summary : "Pairs with this niqab"}</span>
              </div>
              <div className="look__actions">
                <WishlistButton handle={p.handle} name={p.name} />
                <button type="button" className="look__add" aria-label={`Add ${p.name} to bag`} onClick={(e) => addItem(k, e.currentTarget)}>
                  <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="look__foot">
          <p className="look__foot-title">Complete the look</p>
          <p className="card__summary">Both pieces, added to your bag together.</p>
          <button type="button" className="btn look__all" onClick={(e) => items.forEach((_, k) => addItem(k, k === 0 ? e.currentTarget : null))}>
            Add full look to bag
          </button>
        </div>
      </aside>
    </div>
  );
}

// The pieces of the look in view, right under the row, so a phone can shop without opening anything.
function LookPieces({ look, pieces }: { look: Look; pieces: Record<string, Product> }) {
  const { add } = useCart();
  const items = piecesOf(look, pieces);
  return (
    <div className="tryon__pieces container">
      <p className="tryon__pieces-title">
        {look.title}, {items.length} pieces
      </p>
      <ul className="tryon__pieces-list">
        {items.map((p, k) => (
          <li key={p.handle} className="piece">
            <Link href={`/products/${p.handle}`} className="piece__thumb" tabIndex={-1} aria-hidden="true">
              <ProductImage src={imageOf(p)} kind={p.kind} name={p.name} sizes="64px" />
              <span className="look__num" aria-hidden="true">{k + 1}</span>
            </Link>
            <span className="piece__text">
              <Link href={`/products/${p.handle}`} className="piece__name">{p.name}</Link>
              <span className="card__summary">{k === 0 ? p.summary : "Pairs with this niqab"}</span>
            </span>
            <button type="button" className="look__add" aria-label={`Add ${p.name} to bag`} onClick={(e) => add({ handle: p.handle, name: p.name, variant: p.variants?.[0]?.name, image: imageOf(p), kind: p.kind, merchandiseId: p.variants?.[0]?.id ?? p.variantId }, e.currentTarget)}>
              <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
