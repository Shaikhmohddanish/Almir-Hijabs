import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collectionProducts, productByHandle, productHandles } from "@/lib/commerce";
import { site } from "@/lib/site";
import { getCollection, type Product } from "../../catalog";
import ProductCard from "../../components/ProductCard";
import ProductView from "../../components/ProductView";

// Every handle is prerendered from generateStaticParams; the segment may block while params resolve.
export const instant = false;

export async function generateStaticParams() {
  return (await productHandles()).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const p = await productByHandle((await params).handle);
  return p ? { title: p.name, description: p.description } : {};
}

// What search engines read to show a price and "in stock" next to the listing. Only a product with a price has any.
function structuredData(p: Product) {
  if (!p.price) return null;
  const offer = p.maxPrice
    ? { "@type": "AggregateOffer", lowPrice: p.price.amount, highPrice: p.maxPrice.amount, priceCurrency: p.price.currencyCode, offerCount: p.variants?.length }
    : { "@type": "Offer", price: p.price.amount, priceCurrency: p.price.currencyCode, availability: p.available === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" };
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.summary || p.description,
    image: p.gallery?.length ? p.gallery.map((g) => g.url) : p.image ? [p.image] : undefined,
    url: `${site.url}/products/${p.handle}`,
    offers: offer,
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const product = await productByHandle((await params).handle);
  if (!product) notFound();
  const collection = getCollection(product.collection)!;
  const more = (await collectionProducts(product.collection)).filter((p) => p.handle !== product.handle).slice(0, 4);
  const ld = structuredData(product);
  return (
    <main id="main">
      {/* "<" is escaped so the shop's own text can't close the script early. */}
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <section className="product container" aria-label={product.name}>
        <ol className="crumbs" aria-label="Breadcrumb">
          <li><Link href="/">Home</Link></li>
          <li><Link href={`/collections/${collection.id}`}>{collection.name}</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
        <ProductView product={product} />
      </section>
      {more.length > 0 && (
        <section className="related container" aria-labelledby="related-title">
          <h2 id="related-title">More {collection.name.toLowerCase()}</h2>
          <ul className="grid-products">
            {more.map((p, i) => (
              <ProductCard key={p.handle} product={p} level="h3" index={i} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
