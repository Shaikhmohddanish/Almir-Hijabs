import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collectionInfo, collectionProducts } from "@/lib/commerce";
import { collections, getCollection } from "../../catalog";
import CollectionGrid from "../../components/CollectionGrid";

// Every handle is prerendered from generateStaticParams; the segment may block while params resolve.
export const instant = false;

// The shop has these three collections; Shopify supplies their wording and their products.
export function generateStaticParams() {
  return collections.map((c) => ({ handle: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const local = getCollection((await params).handle);
  const c = local && (await collectionInfo(local.id));
  return c ? { title: c.name, description: c.intro } : {};
}

export default async function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  const local = getCollection((await params).handle);
  if (!local) notFound();
  const [collection = local, items] = await Promise.all([collectionInfo(local.id), collectionProducts(local.id)]);
  return (
    <main id="main">
      <section className="page-head" aria-labelledby="collection-title">
        <div className="container">
          <ol className="crumbs" aria-label="Breadcrumb">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">{collection.name}</li>
          </ol>
          <div className="grid-12" data-reveal suppressHydrationWarning>
            <h1 id="collection-title">{collection.name}</h1>
            <p className="lead">
              {collection.intro} {items.length} styles.
            </p>
          </div>
        </div>
      </section>
      <section className="container" aria-label={`${collection.name} styles`}>
        <CollectionGrid products={items} />
      </section>
      <nav className="other-collections container" aria-label="Other collections">
        {collections
          .filter((c) => c.id !== collection.id)
          .map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="other-collections__link">
              <span className="offer__name">{c.name}</span>
              <span>{c.line}</span>
            </Link>
          ))}
      </nav>
    </main>
  );
}
