// Pins the page behind an overlay and returns the function that releases it.
// `overflow: hidden` on the body does not do this here: html carries overflow-x: clip, so the body's value is never
// handed to the viewport, and iOS ignores it anyway. The body is held in place instead, and the scroll position is
// put back on release. Overlays can nest; the page is released when the last one lets go.
let holds = 0;
let saved: { y: number; style: string | null; href: string } | null = null;

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const body = document.body;
  if (holds++ === 0) {
    const y = window.scrollY;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    saved = { y, style: body.getAttribute("style"), href: window.location.href };
    Object.assign(body.style, { position: "fixed", top: `-${y}px`, left: "0", right: "0", overflow: "hidden", paddingRight: gutter > 0 ? `${gutter}px` : "" });
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--holds > 0 || !saved) return;
    const { y, style, href } = saved;
    saved = null;
    if (style === null) document.body.removeAttribute("style");
    else document.body.setAttribute("style", style);
    // A link inside the overlay may have moved the address (a new page, or an anchor): then the router has already
    // placed the scroll, and putting the old position back would undo it.
    if (window.location.href === href) window.scrollTo({ top: y, behavior: "instant" });
  };
}
