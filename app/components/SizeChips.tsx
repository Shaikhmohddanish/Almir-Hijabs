"use client";

import type { Product } from "../catalog";

// Niqabs come in sizes. On the product page Size is one option among the others; in the rail's close-up and
// the lookbook it is the only choice asked for, and any other option keeps its first value.
type Choosable = Pick<Product, "options" | "variants">;

export const sizesOf = (p: Choosable) => p.options?.find((o) => o.name === "Size")?.values ?? [];

// The variant to buy in a size, one in stock first. No size given (a piece without sizes) means its first variant.
export function variantForSize(p: Choosable, size?: string) {
  const fit = (p.variants ?? []).filter((v) => !size || v.options?.some((c) => c.name === "Size" && c.value === size));
  return fit.find((v) => v.available !== false) ?? fit[0];
}

export default function SizeChips({ sizes, value, onChange, name, small = false }: { sizes: string[]; value?: string; onChange: (size: string) => void; name: string; small?: boolean }) {
  return (
    <div className={small ? "size-chips size-chips--s" : "size-chips"} role="group" aria-label={`${name}, size`}>
      {sizes.map((s) => (
        <button key={s} type="button" className="chip" aria-pressed={value === s} onClick={() => onChange(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
