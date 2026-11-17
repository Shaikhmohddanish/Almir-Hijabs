"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Typing updates ?q= in place (no reload); the server page runs the search (Shopify's search once connected).
export default function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const onChange = (value: string) => {
    setQ(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => router.replace(value ? `/search?q=${encodeURIComponent(value)}` : "/search", { scroll: false }), 250);
  };
  return (
    <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
      <label htmlFor="search-q" className="visually-hidden">Search the shop</label>
      <Search size={20} strokeWidth={1.5} aria-hidden="true" />
      <input id="search-q" type="search" name="q" autoComplete="off" enterKeyHint="search" placeholder="Niqab, lace, gold, A18…" value={q} onChange={(e) => onChange(e.target.value)} />
    </form>
  );
}
