"use client";

// Adapted from Aceternity UI, "Placeholders and Vanish Input" (ui.aceternity.com). Changes for this shop: the paper and ink
// tokens instead of the zinc palette, square edges, a visible focus ring, 16px text (smaller text makes iOS zoom the page),
// reduced motion respected, the vanish painted in the page's own ink instead of an inverted white, one submit path (the
// original also ran on Enter's keydown, so it started twice), and the pixels read once on submit instead of on every key.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; color: string };

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  label = "Search",
  name = "q",
  className,
}: {
  placeholders: string[];
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  label?: string;
  name?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [value, setValue] = useState("");
  const [animating, setAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const particles = useRef<Particle[]>([]);

  // The suggestion changes every three seconds while the tab is showing.
  useEffect(() => {
    if (reduce || placeholders.length < 2) return;
    let timer = 0;
    const start = () => {
      timer = window.setInterval(() => setCurrent((c) => (c + 1) % placeholders.length), 3000);
    };
    const onVisibility = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [placeholders, reduce]);

  // Paints the typed text in ink on the canvas and keeps every lit pixel as a particle.
  const draw = () => {
    const input = inputRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!input || !canvas || !ctx) return;
    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const style = getComputedStyle(input);
    ctx.font = `${parseFloat(style.fontSize) * 2}px ${style.fontFamily}`;
    ctx.fillStyle = getComputedStyle(document.body).color;
    ctx.fillText(value, 16, 40);
    const { data } = ctx.getImageData(0, 0, 800, 800);
    const found: Particle[] = [];
    for (let y = 0; y < 800; y++) {
      for (let x = 0; x < 800; x++) {
        const i = 4 * (y * 800 + x);
        if (data[i + 3] > 0) found.push({ x, y, r: 1, color: `rgba(${data[i]}, ${data[i + 1]}, ${data[i + 2]}, ${data[i + 3] / 255})` });
      }
    }
    particles.current = found;
  };

  // The text dissolves from its right edge to its left, then the field is empty again.
  const dissolve = (from: number) => {
    const frame = (edge: number) => {
      requestAnimationFrame(() => {
        const kept: Particle[] = [];
        for (const p of particles.current) {
          if (p.x < edge) {
            kept.push(p);
            continue;
          }
          if (p.r <= 0) continue;
          p.x += Math.random() > 0.5 ? 1 : -1;
          p.y += Math.random() > 0.5 ? 1 : -1;
          p.r -= 0.05 * Math.random();
          kept.push(p);
        }
        particles.current = kept;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(edge, 0, 800, 800);
          for (const { x, y, r, color } of kept) {
            if (x > edge) {
              ctx.beginPath();
              ctx.rect(x, y, r, r);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          }
        }
        if (kept.length > 0) frame(edge - 8);
        else {
          setValue("");
          setAnimating(false);
        }
      });
    };
    frame(from);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value || animating) return;
    onSubmit(e);
    if (reduce) {
      setValue("");
      return;
    }
    setAnimating(true);
    draw();
    dissolve(particles.current.reduce((max, p) => Math.max(max, p.x), 0));
  };

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        "relative mx-auto h-12 w-full max-w-xl overflow-hidden border border-border bg-background transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring motion-reduce:transition-none",
        className,
      )}
    >
      <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none absolute left-4 top-[20%] origin-top-left scale-50 text-base", animating ? "opacity-100" : "opacity-0")} />
      <input
        ref={inputRef}
        name={name}
        type="text"
        enterKeyHint="search"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label={label}
        value={value}
        onChange={(e) => {
          if (animating) return;
          setValue(e.target.value);
          onChange(e);
        }}
        className={cn("relative z-10 h-full w-full border-0 bg-transparent pl-4 pr-14 text-base text-foreground outline-none", animating && "text-transparent")}
      />
      <button
        type="submit"
        disabled={!value}
        aria-label={label}
        className="absolute right-1.5 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center bg-foreground text-background outline-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-muted disabled:text-muted-foreground motion-reduce:transition-none"
      >
        <motion.svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4" aria-hidden="true">
          <motion.path d="M5 12l14 0" initial={{ strokeDasharray: "50%", strokeDashoffset: "50%" }} animate={{ strokeDashoffset: value ? 0 : "50%" }} transition={{ duration: 0.3, ease: "linear" }} />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              key={`placeholder-${current}`}
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              transition={{ duration: 0.3, ease: "linear" }}
              className="w-[calc(100%-4rem)] truncate pl-4 text-left text-base font-normal text-muted-foreground"
            >
              {placeholders[current]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
