"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "../catalog";
import ProductCard from "./ProductCard";

const filters = [
  { id: "all", label: "All", test: () => true },
  { id: "named", label: "Named styles", test: (p: Product) => !p.handle.includes("-design-") },
  { id: "catalogue", label: "Catalogue designs", test: (p: Product) => p.handle.includes("-design-") },
  { id: "colours", label: "With colour options", test: (p: Product) => (p.variants?.length ?? 0) > 1 },
] as const;

// Filter chips and a sort for a collection's products, all in the browser.
export default function CollectionGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [sort, setSort] = useState("catalogue");
  const priced = products.some((p) => p.price);
  const shown = useMemo(() => {
    const test = filters.find((f) => f.id === filter)!.test;
    const list = products.filter(test);
    const amount = (p: Product) => Number(p.price?.amount ?? 0);
    if (sort === "az") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "za") return [...list].sort((a, b) => b.name.localeCompare(a.name));
    if (sort === "low") return [...list].sort((a, b) => amount(a) - amount(b));
    if (sort === "high") return [...list].sort((a, b) => amount(b) - amount(a));
    return list;
  }, [products, filter, sort]);
  const available = filters.filter((f) => products.some(f.test));

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__chips" role="group" aria-label="Filter">
          {available.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="toolbar__sort">
          <span className="option-label">Sort</span>
          <span className="select">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="catalogue">Catalogue order</option>
              <option value="az">Name, A to Z</option>
              <option value="za">Name, Z to A</option>
              {priced && <option value="low">Price, low to high</option>}
              {priced && <option value="high">Price, high to low</option>}
            </select>
            <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
          </span>
        </label>
        <p className="toolbar__count" aria-live="polite">{shown.length} {shown.length === 1 ? "style" : "styles"}</p>
      </div>
      <ul className="grid-products">
        {shown.map((p, i) => (
          <ProductCard key={p.handle} product={p} index={i} />
        ))}
      </ul>
    </>
  );
}
