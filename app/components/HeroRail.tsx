"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import { shopify } from "@/lib/shopify";
import type { Garment } from "@/lib/shopify-map";
import { useCart } from "./CartProvider";
import SizeChips, { sizesOf, variantForSize } from "./SizeChips";

// The 21st clothing rail with the shop's own actions in its close-up: size, add to bag, buy now and the product page.
export default function HeroRail({ items }: { items: Garment[] }) {
  // The rail hands back only its own item type, so the piece's variants are looked up by its id.
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  // The rail only moves by itself on a wide screen; on a phone it waits for a finger.
  const [auto, setAuto] = useState(false);
  useEffect(() => setAuto(window.matchMedia("(min-width: 60.0625rem)").matches), []);
  return (
    <ClothingRailHero
      items={items}
      hanger="wood"
      autoplay={auto}
      interval={3200}
      caption="Run a finger or the pointer along the rail, then open a niqab."
      aria-label="Niqabs on a rail"
      renderDetailActions={(item) => <RailActions key={item.id} item={byId[item.id] ?? item} />}
    />
  );
}

// Keyed by the piece, so paging through the close-up starts each piece at its first size.
function RailActions({ item }: { item: Garment }) {
  const { add, buyNow, buying } = useCart();
  const sizes = sizesOf(item);
  const [size, setSize] = useState(sizes[0]);
  const variantId = variantForSize(item, size)?.id ?? item.variantId;
  return (
    <div className="rail-detail__buy">
      {sizes.length > 1 && <SizeChips sizes={sizes} value={size} onChange={setSize} name={item.name} />}
      <div className="rail-detail__actions">
        <button type="button" className="btn" onClick={(e) => add({ handle: item.id, name: item.name, variant: size, image: item.image, kind: "cutout", merchandiseId: variantId }, e.currentTarget)}>
          Add to bag
        </button>
        {shopify.enabled && (
          <button type="button" className="btn btn--line" disabled={buying} onClick={() => buyNow(variantId)}>
            {buying ? "One moment…" : "Buy now"}
          </button>
        )}
        <Link className="link" href={`/products/${item.id}`}>View product page</Link>
      </div>
    </div>
  );
}
