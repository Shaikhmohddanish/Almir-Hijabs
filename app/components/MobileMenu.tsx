"use client";

import { Menu } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { lockScroll } from "@/lib/scroll-lock";
import type { MenuCollection } from "./MenuSheet";

// The sheet, and the motion library behind it, load in the background shortly after the page, so the first tap opens at once
// and the first paint carries none of it.
const loadSheet = () => import("./MenuSheet");
const MenuSheet = dynamic(loadSheet, { ssr: false });

export default function MobileMenu({ accountHref, collections }: { accountHref: string; collections: MenuCollection[] }) {
  const [open, setOpen] = useState(false);
  const [wanted, setWanted] = useState(false);
  const pathname = usePathname();
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    // Only where the menu button shows; a wider screen never loads the sheet or the library behind it.
    if (!window.matchMedia("(max-width: 60rem)").matches) return;
    const t = window.setTimeout(() => setWanted(true), 2000);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlock();
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="icon-link menu-toggle"
        aria-label="Open the menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerDown={() => {
          loadSheet();
          setWanted(true);
        }}
        onClick={() => {
          setWanted(true);
          setOpen(true);
        }}
      >
        <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {wanted && <MenuSheet open={open} onClose={() => setOpen(false)} onDismiss={dismiss} accountHref={accountHref} collections={collections} />}
    </>
  );
}
