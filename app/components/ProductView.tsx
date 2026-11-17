"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import type { Product, Variant } from "../catalog";
import ProductImage from "./ProductImage";
import { useCart, WishlistButton } from "./CartProvider";

type Choice = { name: string; value: string };

// The product's choices as options, whether they came from Shopify (any number of options) or the local catalogue (one list).
const optionsOf = (p: Product) => p.options ?? (p.variants?.length ? [{ name: p.optionName ?? "Option", values: p.variants.map((v) => v.name) }] : []);
const choicesOf = (p: Product, v: Variant): Choice[] => v.options ?? [{ name: p.optionName ?? "Option", value: v.name }];
const picks = (p: Product, v: Variant) => Object.fromEntries(choicesOf(p, v).map((c) => [c.name, c.value]));
const fits = (p: Product, v: Variant, picked: Record<string, string>) => choicesOf(p, v).every((c) => picked[c.name] === c.value);
const has = (p: Product, v: Variant, name: string, value: string) => choicesOf(p, v).some((c) => c.name === name && c.value === value);

// The product's picture, its options and the add-to-bag action.
export default function ProductView({ product }: { product: Product }) {
  const [picked, setPicked] = useState(() => {
    const first = product.variants?.find((v) => v.available !== false) ?? product.variants?.[0];
    return first ? picks(product, first) : {};
  });
  const [shot, setShot] = useState<number | null>(null);
  const [added, setAdded] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const { add } = useCart();

  const options = optionsOf(product);
  const variants = product.variants ?? [];
  const chosen = variants.find((v) => fits(product, v, picked));
  const gallery = product.gallery?.length ? product.gallery : product.image ? [{ url: product.image }] : [];
  // One option whose values have their own photographs is shown as swatches, and those photographs are the gallery.
  const swatchy = options.length === 1 && variants.some((v) => v.image);
  // A photograph the shopper picked wins, then the chosen variant's own, then the product's first.
  const image = (shot !== null ? gallery[shot]?.url : undefined) ?? chosen?.image ?? product.image;
  const unit = chosen?.price ?? product.price;
  const compareAt = chosen ? chosen.compareAt : product.compareAt;
  const available = chosen ? chosen.available !== false : product.available !== false;

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 2400);
    return () => window.clearTimeout(t);
  }, [added]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) video.current?.pause();
  }, []);

  const choose = (name: string, value: string) => {
    let next = { ...picked, [name]: value };
    // Not every combination exists. If this one doesn't, move to the nearest that does, one in stock first.
    if (!variants.some((v) => fits(product, v, next))) {
      const near = variants.find((v) => has(product, v, name, value) && v.available !== false) ?? variants.find((v) => has(product, v, name, value));
      if (near) next = picks(product, near);
    }
    setPicked(next);
    setShot(null);
  };

  const onAdd = async (from: Element) => {
    const ok = await add({ handle: product.handle, name: product.name, variant: chosen?.name, image: chosen?.image ?? product.image, kind: product.kind, merchandiseId: chosen?.id ?? product.variantId }, from);
    if (ok) setAdded(true);
  };

  return (
    <div className="grid-12 product__grid">
      <div className="product__gallery">
        <ProductImage key={image ?? "none"} src={image} kind={product.kind} name={chosen ? `${product.name}, ${chosen.name}` : product.name} sizes="(max-width: 60rem) 100vw, 58vw" priority />
        {gallery.length > 1 && !swatchy && (
          <ul className="product__thumbs" aria-label="Photographs">
            {gallery.map((g, i) => (
              <li key={g.url}>
                <button type="button" className="swatch-btn" aria-pressed={image === g.url} aria-label={`Photograph ${i + 1} of ${gallery.length}`} onClick={() => setShot(i)}>
                  <Image src={g.url} alt="" width={56} height={70} />
                </button>
              </li>
            ))}
          </ul>
        )}
        {product.video && <video ref={video} className="product__video" src={product.video.src} poster={product.video.poster} muted loop playsInline autoPlay controls preload="metadata" aria-label={`${product.name}, worn`} />}
      </div>
      <div className="product__info" data-reveal suppressHydrationWarning>
        <h1>{product.name}</h1>
        <p className="price">
          {unit ? (
            <>
              {formatMoney(unit)}
              {compareAt && (
                <s>
                  <span className="sr-only">was </span>
                  {formatMoney(compareAt)}
                </s>
              )}
            </>
          ) : (
            <span className="fill" data-fill="price">Price to be confirmed</span>
          )}
        </p>
        {options.map((o) => (
          <fieldset className="options" key={o.name}>
            <legend className="option-label">
              {o.name}: {picked[o.name]}
            </legend>
            <ul className="swatches">
              {o.values.map((value) => {
                const rep = variants.find((v) => has(product, v, o.name, value));
                // A value is out only when every variant that has it is sold out.
                const out = variants.filter((v) => has(product, v, o.name, value)).every((v) => v.available === false);
                return (
                  <li key={value}>
                    {swatchy && rep?.image ? (
                      <button type="button" className="swatch-btn" aria-pressed={picked[o.name] === value} aria-label={out ? `${value}, sold out` : value} disabled={out} onClick={() => choose(o.name, value)}>
                        <Image src={rep.image} alt="" width={56} height={70} />
                      </button>
                    ) : (
                      <button type="button" className="chip" aria-pressed={picked[o.name] === value} disabled={out} onClick={() => choose(o.name, value)}>
                        {value}
                        {out && <span className="sr-only">, sold out</span>}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
        ))}

        <div className="add-row">
          <button type="button" className="btn" disabled={!available} onClick={(e) => onAdd(e.currentTarget)}>
            {!available ? "Sold out" : added ? "Added to bag" : "Add to bag"}
          </button>
          <WishlistButton handle={product.handle} name={product.name} />
          <Link className="link" href="/cart">
            View bag
          </Link>
        </div>
        <p className="status" role="status">
          {added ? `${product.name}${chosen ? `, ${chosen.name}` : ""} is in your bag.` : ""}
        </p>

        {/* The description is written in the Shopify admin, like the policy pages, so its own formatting is kept. */}
        {product.descriptionHtml ? <div className="rich" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} /> : <p className="lead">{product.description}</p>}

        <ul className="facts-list">
          {!product.descriptionHtml && product.details.map((d) => <li key={d}>{d}</li>)}
          <li>
            Delivery and returns: <Link href="/policies/shipping">see shipping</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
