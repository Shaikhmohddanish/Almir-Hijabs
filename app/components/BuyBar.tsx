"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

// The sticky shop bar. Without script it sits in the flow at the end of the page;
// with script it is fixed to the bottom and shown once the hero has scrolled away.
export default function BuyBar() {
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.classList.add("js");
    const hero = document.getElementById("hero");
    const el = bar.current;
    if (!hero || !el) return;
    const io = new IntersectionObserver(([entry]) => {
      el.classList.toggle("is-shown", !entry.isIntersecting);
    });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <nav className="buybar" ref={bar} aria-label="Shop by collection">
      <div className="container buybar__inner">
        <p className="buybar__label">Shop by collection</p>
        <ul className="buybar__links">
          <li>
            <Link href="/collections/hijabs">Hijabs</Link>
          </li>
          <li>
            <Link href="/collections/niqabs">Niqabs</Link>
          </li>
          <li>
            <Link href="/collections/undercaps">Undercaps</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
