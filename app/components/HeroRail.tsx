"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ClothingRailHero from "@/components/ui/product-rail-gallery";
import type { Garment } from "@/lib/shopify-map";
import { useCart } from "./CartProvider";

// The 21st clothing rail with the shop's own actions in its close-up: add to bag and the product page.
export default function HeroRail({ items }: { items: Garment[] }) {
  const { add } = useCart();
  // The rail hands back only its own item type, so the Shopify variant to add is looked up by the piece's id.
  const variantOf = Object.fromEntries(items.map((i) => [i.id, i.variantId]));
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
      renderDetailActions={(item) => (
        <div className="rail-detail__actions">
          <button type="button" className="btn" onClick={(e) => add({ handle: item.id, name: item.name, image: item.image, kind: "cutout", merchandiseId: variantOf[item.id] }, e.currentTarget)}>
            Add to bag
          </button>
          <Link className="link" href={`/products/${item.id}`}>View product page</Link>
        </div>
      )}
    />
  );
}
