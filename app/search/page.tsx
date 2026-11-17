import type { Metadata } from "next";
import { searchProducts } from "@/lib/commerce";
import ProductCard from "../components/ProductCard";
import SearchBox from "../components/SearchBox";

export const metadata: Metadata = { title: "Search", description: "Search every niqab, hijab and undercap." };
// The query comes from the URL, so this page renders per request.
export const instant = false;

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  const hits = await searchProducts(q);
  return (
    <main id="main" className="container store-page">
      <h1 className="store-page__title">Search</h1>
      <SearchBox initial={q} />
      <p className="toolbar__count" aria-live="polite">
        {q.trim() ? `${hits.length} ${hits.length === 1 ? "result" : "results"} for “${q.trim()}”` : "Search every niqab, hijab and undercap by name, colour or design number."}
      </p>
      {hits.length > 0 && (
        <ul className="grid-products">
          {hits.map((p, i) => (
            <ProductCard key={p.handle} product={p} index={i} />
          ))}
        </ul>
      )}
    </main>
  );
}
