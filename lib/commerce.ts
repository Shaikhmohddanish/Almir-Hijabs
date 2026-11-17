// Store data for the pages: Shopify when it is configured, the local catalogue until then.
import { cacheLife } from "next/cache";
import {
  collections,
  getCollection,
  getProduct,
  imageOf,
  lookPairing,
  looks,
  products as localProducts,
  productsIn,
  railNiqabs,
  undercapColours,
  type Collection,
  type CollectionId,
  type Product,
} from "@/app/catalog";
import { shopify, storefront } from "./shopify";
import { COLLECTION_INFO, COLLECTION_PRODUCTS, POLICIES, PRODUCT, PRODUCT_HANDLES, RAIL, SEARCH } from "./shopify-queries";
import { garmentOf, toGarment, toProduct, type Garment, type ProductNode } from "./shopify-map";

type Page = { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ProductNode[] };
const collectionIds = collections.map((c) => c.id);

// Every product of a collection, however many pages Shopify splits it into.
async function collectionNodes(handle: string): Promise<ProductNode[]> {
  const nodes: ProductNode[] = [];
  let after: string | null = null;
  for (let page = 0; page < 10; page++) {
    const d: { collection: { products: Page } | null } = await storefront(COLLECTION_PRODUCTS, { handle, after });
    if (!d.collection) break;
    nodes.push(...d.collection.products.nodes);
    if (!d.collection.products.pageInfo.hasNextPage) break;
    after = d.collection.products.pageInfo.endCursor;
  }
  return nodes;
}

export async function collectionProducts(id: CollectionId): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  if (!shopify.enabled) return productsIn(id);
  return (await collectionNodes(id)).map((n) => toProduct(n, id));
}

export async function productByHandle(handle: string): Promise<Product | undefined> {
  "use cache";
  cacheLife("minutes");
  if (!shopify.enabled) return getProduct(handle);
  const d = await storefront<{ product: ProductNode | null }>(PRODUCT, { handle });
  return d.product ? toProduct(d.product) : undefined;
}

export async function searchProducts(q: string): Promise<Product[]> {
  "use cache";
  cacheLife("minutes");
  const term = q.trim();
  if (!term) return [];
  if (!shopify.enabled) {
    const t = term.toLowerCase();
    return localProducts.filter((p) => `${p.name} ${p.summary} ${p.collection} ${p.details.join(" ")}`.toLowerCase().includes(t));
  }
  const d = await storefront<{ search: { nodes: ProductNode[] } }>(SEARCH, { q: term });
  return d.search.nodes.map((n) => toProduct(n));
}

// Every product handle, for the pages that are built ahead of time.
export async function productHandles(): Promise<string[]> {
  if (!shopify.enabled) return localProducts.map((p) => p.handle);
  const handles: string[] = [];
  let after: string | null = null;
  for (let page = 0; page < 20; page++) {
    const d: { products: { pageInfo: Page["pageInfo"]; nodes: { handle: string }[] } } = await storefront(PRODUCT_HANDLES, { after });
    handles.push(...d.products.nodes.map((n) => n.handle));
    if (!d.products.pageInfo.hasNextPage) break;
    after = d.products.pageInfo.endCursor;
  }
  return handles;
}

// The collection's name and intro: the shop's own words from Shopify, ours until it has written any.
export async function collectionInfo(id: CollectionId): Promise<Collection | undefined> {
  "use cache";
  cacheLife("minutes");
  const local = getCollection(id);
  if (!local || !shopify.enabled) return local;
  const d = await storefront<{ collection: { title: string; description: string } | null }>(COLLECTION_INFO, { handle: id });
  return { ...local, name: d.collection?.title || local.name, intro: d.collection?.description.trim() || local.intro };
}

// The home page rail: the Shopify collection "hero-rail" in the order the shop set. Until that has pieces, the first niqabs with a photograph.
export async function railGarments(): Promise<Garment[]> {
  "use cache";
  cacheLife("minutes");
  if (!shopify.enabled) return railNiqabs;
  const d = await storefront<{ collection: { products: { nodes: ProductNode[] } } | null }>(RAIL, { handle: "hero-rail" });
  const picked = d.collection?.products.nodes ?? [];
  if (picked.length) return picked.map(toGarment);
  return (await collectionProducts("niqabs")).filter((p) => p.image).slice(0, 18).map((p) => garmentOf(p));
}

// Everything the home page shows, from one place.
export async function homeData() {
  const groups = await Promise.all(collectionIds.map(collectionProducts));
  const byCollection = Object.fromEntries(collectionIds.map((id, i) => [id, groups[i]])) as Record<CollectionId, Product[]>;
  // A product can sit in two collections; it is still one piece.
  const all = [...new Map(groups.flat().map((p) => [p.handle, p])).values()];
  const byHandle = Object.fromEntries(all.map((p) => [p.handle, p])) as Record<string, Product>;
  // The lookbook is ours; a look whose product is missing from the shop would lose its "add to bag".
  if (shopify.enabled) for (const h of [...looks.map((l) => l.handle), lookPairing]) if (!byHandle[h]) console.warn(`The lookbook uses "${h}", which is not in the Shopify store.`);
  // The shade card: the plain jersey undercap, one tile for every colour that has its own photograph.
  const shade = shopify.enabled
    ? (byHandle[lookPairing]?.variants ?? []).flatMap((v) => (v.image ? [{ name: v.name, src: v.image, handle: lookPairing }] : []))
    : undercapColours;
  return { byCollection, all, byHandle, rail: await railGarments(), shade, count: all.length };
}

// The phone menu's collection rows: the real counts and one photograph each.
export async function menuCollections() {
  const groups = await Promise.all(collectionIds.map(collectionProducts));
  return collections.map((c, i) => {
    const first = groups[i].find((p) => imageOf(p));
    return { id: c.id, name: c.name, href: `/collections/${c.id}`, count: groups[i].length, image: first ? imageOf(first) : undefined, kind: first?.kind };
  });
}

// Every product, for pages that look pieces up by handle in the browser (the wishlist).
export async function allProducts(): Promise<Product[]> {
  const groups = await Promise.all(collectionIds.map(collectionProducts));
  return [...new Map(groups.flat().map((p) => [p.handle, p])).values()];
}

export type Policy = { title: string; body: string };
const policyField = { shipping: "shippingPolicy", returns: "refundPolicy", privacy: "privacyPolicy", terms: "termsOfService" } as const;

// Shopify generates and stores the shop's policies (Settings, Policies); the page shows that text.
export async function shopPolicy(slug: keyof typeof policyField): Promise<Policy | null> {
  "use cache";
  cacheLife("hours");
  if (!shopify.enabled) return null;
  const d = await storefront<{ shop: Record<string, Policy | null> }>(POLICIES);
  return d.shop[policyField[slug]];
}
