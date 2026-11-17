"use client";

import Link from "next/link";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { lockScroll } from "@/lib/scroll-lock";
import type { ImageKind } from "../catalog";
import { WishlistButton } from "./CartProvider";
import ProductImage from "./ProductImage";

export type StorySlide = { src: string; kind?: ImageKind; title: string; sub: string; href: string; handle: string };
export type StoryGroup = { id: string; label: string; slides: StorySlide[] };

const DURATION = 4800;

// The phone's quick way into a collection: a row of rings, each opening a full-screen set of pieces.
// Tap the right side for the next piece, the left for the last; hold to pause; swipe sideways for the
// next group; swipe down to close. Only transform and opacity ever animate.
export default function Stories({ groups }: { groups: StoryGroup[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const opener = useRef<HTMLElement | null>(null);
  const markSeen = (id: string) => setSeen((old) => (old.includes(id) ? old : [...old, id]));
  const close = () => {
    setOpen(null);
    opener.current?.focus();
  };
  return (
    <section className="stories" aria-label="Stories">
      <ul className="stories__row">
        {groups.map((g, i) => (
          <li key={g.id}>
            <button
              type="button"
              className="story-ring"
              data-seen={seen.includes(g.id)}
              aria-label={`Open ${g.label}, ${g.slides.length} pieces`}
              onClick={(e) => {
                opener.current = e.currentTarget;
                setOpen(i);
              }}
            >
              <span className="story-ring__ring">
                <span className="story-ring__img">
                  <Image src={g.slides[0].src} alt="" fill sizes="72px" />
                </span>
              </span>
              <span>{g.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {open !== null && <Viewer groups={groups} start={open} onSeen={markSeen} onClose={close} />}
    </section>
  );
}

function Viewer({ groups, start, onSeen, onClose }: { groups: StoryGroup[]; start: number; onSeen: (id: string) => void; onClose: () => void }) {
  const [pos, setPos] = useState({ g: start, s: 0 });
  const [held, setHeld] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const ptr = useRef({ id: -1, x: 0, y: 0, held: false, timer: 0 });
  const group = groups[pos.g];
  const slide = group.slides[pos.s];

  useEffect(() => {
    closeBtn.current?.focus();
    const unlock = lockScroll();
    return () => {
      unlock();
      window.clearTimeout(ptr.current.timer);
    };
  }, []);

  const nextGroup = () => {
    onSeen(group.id);
    if (pos.g < groups.length - 1) setPos({ g: pos.g + 1, s: 0 });
    else onClose();
  };
  const prevGroup = () => setPos({ g: Math.max(0, pos.g - 1), s: 0 });
  const next = () => (pos.s < group.slides.length - 1 ? setPos({ g: pos.g, s: pos.s + 1 }) : nextGroup());
  const prev = () => (pos.s > 0 ? setPos({ g: pos.g, s: pos.s - 1 }) : prevGroup());

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    window.clearTimeout(ptr.current.timer);
    ptr.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      held: false,
      timer: window.setTimeout(() => {
        ptr.current.held = true;
        setHeld(true);
      }, 220),
    };
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const p = ptr.current;
    if (p.id !== e.pointerId) return;
    window.clearTimeout(p.timer);
    p.id = -1;
    setHeld(false);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? nextGroup() : prevGroup();
    if (dy > 90 && dy > Math.abs(dx)) return onClose();
    if (p.held) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width * 0.35) prev();
    else next();
  };
  const cancel = () => {
    window.clearTimeout(ptr.current.timer);
    ptr.current.id = -1;
    setHeld(false);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  };

  return (
    <div className="story" role="dialog" aria-modal="true" aria-label={`${group.label} stories`} data-held={held} style={{ "--story-dur": `${DURATION}ms` } as CSSProperties} onKeyDown={onKey}>
      <div className="story__top">
        <ol className="story__bars" aria-hidden="true">
          {group.slides.map((s, i) => (
            <li key={s.src}>
              <i data-state={i < pos.s ? "done" : i === pos.s ? "live" : "todo"} key={i === pos.s ? `${pos.g}-${pos.s}` : i} onAnimationEnd={() => i === pos.s && next()} />
            </li>
          ))}
        </ol>
        <div className="story__who">
          <p className="story__label">
            {group.label} <span className="card__summary">{pos.s + 1} of {group.slides.length}</span>
          </p>
          <button ref={closeBtn} type="button" className="icon-btn" aria-label="Close" onClick={onClose}>
            <X size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="story__stage" onPointerDown={down} onPointerUp={up} onPointerCancel={cancel}>
        <div className="story__frame story__slide" key={`${pos.g}-${pos.s}`}>
          <ProductImage src={slide.src} kind={slide.kind} name={slide.title} sizes="(max-width: 60rem) 90vw, 480px" priority />
        </div>
      </div>
      <div className="story__foot">
        <p className="story__title">{slide.title}</p>
        <p className="card__summary">{slide.sub}</p>
        <div className="story__actions">
          <Link className="btn" href={slide.href}>View piece</Link>
          <WishlistButton handle={slide.handle} name={slide.title} />
        </div>
      </div>
    </div>
  );
}
