// Turns Shopify's answers into the shapes the pages use. Pure functions and types, no runtime imports,
// so scripts/check-shopify-map.mjs can run them on their own.
import type { RailGarment } from "@/components/ui/product-rail-gallery";
import type { CollectionId, ImageKind, Money, Product, Variant } from "@/app/catalog";

export type VariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
  image: { url: string; altText: string | null } | null;
};
export type MediaNode = {
  mediaContentType: string;
  image?: { url: string; altText: string | null };
  sources?: { url: string; mimeType: string }[];
  previewImage?: { url: string } | null;
};
export type ProductNode = {
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  availableForSale: boolean;
  tags: string[];
  seo: { description: string | null };
  featuredImage: { url: string; altText: string | null } | null;
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  options: { name: string; values: string[] }[];
  variants: { nodes: VariantNode[] };
  collections: { nodes: { handle: string }[] };
  media?: { nodes: MediaNode[] };
  backImage?: { reference: { image: { url: string } | null } | null } | null;
  railImage?: { url: string } | null;
};

const collectionIds = ["hijabs", "niqabs", "undercaps"] as const;
const imageKinds = ["cutout", "studio", "grey"] as const;
const defaultKind: Record<CollectionId, ImageKind> = { hijabs: "cutout", niqabs: "cutout", undercaps: "grey" };

export function collectionOf(handles: string[], fallback: CollectionId = "niqabs"): CollectionId {
  return handles.find((h): h is CollectionId => (collectionIds as readonly string[]).includes(h)) ?? fallback;
}

// How a picture is framed follows its collection; a tag such as "kind:studio" on the product overrides that.
export function kindOf(tags: string[], collection: CollectionId): ImageKind {
  const tag = tags.find((t) => t.startsWith("kind:"))?.slice(5);
  return imageKinds.find((k) => k === tag) ?? defaultKind[collection];
}

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
const firstParagraph = (html: string) => {
  const m = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(html);
  return m ? text(m[1]) : undefined;
};
const listItems = (html: string) => [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => text(m[1])).filter(Boolean);
const firstSentence = (s: string) => (s.split(/(?<=[.!?])\s/)[0] ?? "").slice(0, 140);

export function toProduct(n: ProductNode, fallback: CollectionId = "niqabs"): Product {
  const collection = collectionOf(n.collections.nodes.map((c) => c.handle), fallback);
  // A product with no choices still has one option, "Title: Default Title". That is not a choice.
  const options = n.options.filter((o) => !(o.name === "Title" && o.values.length === 1 && o.values[0] === "Default Title"));
  const variants: Variant[] = n.variants.nodes.map((v) => ({
    id: v.id,
    name: v.title,
    image: v.image?.url,
    available: v.availableForSale,
    price: v.price,
    compareAt: v.compareAtPrice && Number(v.compareAtPrice.amount) > Number(v.price.amount) ? v.compareAtPrice : undefined,
    options: options.length ? v.selectedOptions : undefined,
  }));
  const html = n.descriptionHtml;
  const description = (html && firstParagraph(html)) || n.description;
  const details = html ? listItems(html) : [];
  const { minVariantPrice: min, maxVariantPrice: max } = n.priceRange;
  const video = n.media?.nodes.find((m) => m.mediaContentType === "VIDEO");
  const source = video?.sources?.find((s) => s.mimeType === "video/mp4") ?? video?.sources?.[0];
  return {
    handle: n.handle,
    name: n.title,
    collection,
    summary: n.seo.description?.trim() || firstSentence(description),
    description,
    details,
    descriptionHtml: html,
    image: n.featuredImage?.url ?? variants.find((v) => v.image)?.image,
    kind: kindOf(n.tags, collection),
    variants: options.length ? variants : undefined,
    options: options.length ? options : undefined,
    optionName: options[0]?.name,
    variantId: n.variants.nodes[0]?.id,
    price: min,
    maxPrice: Number(max.amount) > Number(min.amount) ? max : undefined,
    compareAt: options.length ? undefined : variants[0]?.compareAt,
    available: n.availableForSale,
    gallery: n.media?.nodes.flatMap((m) => (m.image ? [{ url: m.image.url, alt: m.image.altText ?? undefined }] : [])),
    video: source ? { src: source.url, type: source.mimeType, poster: video?.previewImage?.url } : undefined,
    backImage: n.backImage?.reference?.image?.url,
    design: /Catalogue design ([A-Z]\d+)/.exec([description, ...details].join(" "))?.[1],
  };
}

// A piece on the home page rail. It carries the variant the rail's "Add to bag" puts in the bag.
export type Garment = RailGarment & { variantId?: string };

// The design code is the hang tag; `image` is a smaller cut-out when the query asked for one.
export function garmentOf(p: Product, image = p.image): Garment {
  return { id: p.handle, name: p.name, image, backImage: p.backImage, description: p.description, details: p.details, tag: p.design, variantId: p.variantId };
}
export const toGarment = (n: ProductNode): Garment => garmentOf(toProduct(n), n.railImage?.url);

// Just what a card shows, for pages that hand a whole catalogue to the browser (the wishlist).
export const cardOf = (p: Product): Product => ({
  handle: p.handle,
  name: p.name,
  collection: p.collection,
  summary: p.summary,
  description: "",
  details: [],
  image: p.variants?.[0]?.image ?? p.image,
  kind: p.kind,
  price: p.price,
  maxPrice: p.maxPrice,
  available: p.available,
});

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        availableForSale: boolean;
        image: { url: string } | null;
        product: { handle: string; title: string; tags: string[]; collections: { nodes: { handle: string }[] } };
      };
    }[];
  };
};

export type CartLine = {
  key: string;
  handle: string;
  name: string;
  variant?: string;
  image?: string;
  kind?: string;
  qty: number;
  merchandiseId?: string;
  total?: Money;
};

export function cartLines(c: ShopifyCart): CartLine[] {
  return c.lines.nodes.map((l) => {
    const p = l.merchandise.product;
    return {
      key: l.id,
      handle: p.handle,
      name: p.title,
      variant: l.merchandise.title === "Default Title" ? undefined : l.merchandise.title,
      image: l.merchandise.image?.url,
      kind: kindOf(p.tags, collectionOf(p.collections.nodes.map((x) => x.handle))),
      qty: l.quantity,
      merchandiseId: l.merchandise.id,
      total: l.cost.totalAmount,
    };
  });
}
