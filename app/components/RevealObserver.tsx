"use client";

import { useEffect } from "react";

// Adds .is-in to every [data-reveal] element as it scrolls into view, including ones rendered later.
export default function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    const watch = (root: ParentNode) => root.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
    watch(document);
    const mo = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => n instanceof Element && (n.matches("[data-reveal]") ? io.observe(n) : watch(n)))));
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
  return null;
}
