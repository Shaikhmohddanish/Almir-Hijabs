import Link from "next/link";
import type { CSSProperties } from "react";
import { priceLabel } from "@/lib/money";
import { imageOf, type Product } from "../catalog";
import { WishlistButton } from "./CartProvider";
import ProductImage from "./ProductImage";

export default function ProductCard({ product, level = "h2", index = 0 }: { product: Product; level?: "h2" | "h3"; index?: number }) {
  const Heading = level;
  const price = priceLabel(product);
  return (
    <li className="card" data-reveal suppressHydrationWarning style={{ "--i": index % 4 } as CSSProperties}>
      <Link className="card__link" href={`/products/${product.handle}`}>
        <ProductImage src={imageOf(product)} kind={product.kind} name={product.name} sizes="(max-width: 60rem) 50vw, 25vw" />
        <Heading className="card__name">{product.name}</Heading>
        <p className="card__summary">{product.summary}</p>
        {price && <p className="card__price">{price}</p>}
        {product.available === false && <p className="card__flag">Sold out</p>}
      </Link>
      <WishlistButton handle={product.handle} name={product.name} className="card__heart" />
    </li>
  );
}
