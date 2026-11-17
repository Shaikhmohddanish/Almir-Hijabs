import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { homeData } from "@/lib/commerce";
import { collections, imageOf, lookPairing, looks } from "./catalog";
import BuyBar from "./components/BuyBar";
import CollectionSwitcher from "./components/CollectionSwitcher";
import HeroRail from "./components/HeroRail";
import Lookbook from "./components/Lookbook";
import ProductCard from "./components/ProductCard";
import Stories, { type StoryGroup } from "./components/Stories";

// Words as spans, so a headline or a statement can arrive one word at a time.
const words = (text: string) =>
  text.split(" ").map((w, i) => (
    // The space sits outside the span: inside an inline-block it would be trimmed and the words would run together.
    <Fragment key={i}>
      <span className="w" style={{ "--i": i } as CSSProperties}>{w}</span>{" "}
    </Fragment>
  ));

const fromCatalogueHandles = ["niqab-design-b08", "niqab-design-a23", "lace-undercap", "niqab-design-b25", "floral-niqab", "undercap-design-u09", "niqab-design-b13", "gold-panel-niqab"];

export default async function Home() {
  const { byCollection, byHandle, rail, shade, count } = await homeData();

  // The phone's story rings: the same photographs as the shop, grouped.
  const storyGroups: StoryGroup[] = [
    {
      id: "niqabs",
      label: "Niqabs",
      slides: byCollection.niqabs.filter((p) => imageOf(p)).slice(0, 7).map((p) => ({ src: imageOf(p)!, kind: p.kind, title: p.name, sub: p.summary, href: `/products/${p.handle}`, handle: p.handle })),
    },
    {
      id: "undercaps",
      label: "Undercaps",
      slides: shade.slice(0, 8).map((c) => ({ src: c.src, kind: "grey" as const, title: `${c.name} undercap`, sub: "Plain jersey", href: `/products/${c.handle}`, handle: c.handle })),
    },
    {
      id: "looks",
      label: "Looks",
      slides: looks.map((l) => ({ src: l.src, kind: "cutout" as const, title: l.title, sub: l.step, href: `/products/${l.handle}`, handle: l.handle })),
    },
  ];
  const fromCatalogue = fromCatalogueHandles.map((h) => byHandle[h]).filter((p) => p !== undefined);
  // The products the looks are made of, by handle, for the lookbook's "add to bag".
  const pieces = Object.fromEntries([...looks.map((l) => l.handle), lookPairing].flatMap((h) => (byHandle[h] ? [[h, byHandle[h]]] : [])));

  return (
    <>
      <main id="main">
        {/* A shop can lack these pieces (before the import, or after it removes them); a group with no slides has no picture for its ring. */}
        <Stories groups={storyGroups.filter((g) => g.slides.length > 0)} />
        <section className="hero" id="hero" aria-labelledby="hero-title">
          <div className="container hero__head">
            <h1 id="hero-title" className="hero__title">Black niqabs, embroidered and fringed</h1>
            <p className="lead hero__lead">Niqabs, hijabs and undercaps, from embroidered bands to fourteen jersey colours.</p>
            <div className="hero__actions">
              <Link className="btn" href="/collections/niqabs">Shop the niqabs</Link>
              <a className="link" href="#lookbook">Try the look</a>
            </div>
          </div>
          <div className="hero__backdrop" aria-hidden="true">Niqab</div>
          <div className="hero__rail">
            {rail.length > 0 && <HeroRail items={rail} />}
          </div>
        </section>

        <section className="collection" id="collection" aria-labelledby="collection-title">
          <div className="container">
            <div className="grid-12 section-head" data-reveal suppressHydrationWarning>
              <h2 id="collection-title">Every style, listed by name</h2>
              <p className="lead">{count} pieces across three collections.</p>
            </div>
            <CollectionSwitcher
              groups={collections.map((c) => ({
                id: c.id,
                name: c.name,
                href: `/collections/${c.id}`,
                items: byCollection[c.id]
                  .slice(0, 5)
                  .map((p) => ({ name: p.name, detail: p.summary, href: `/products/${p.handle}` })),
              }))}
            />
          </div>
        </section>

        <section className="lookbook" id="lookbook" aria-labelledby="lookbook-title">
          <div className="container tryon-head" data-reveal suppressHydrationWarning>
            <h2 id="lookbook-title">Try the look.</h2>
            <p className="lead">Eight niqabs on display heads. Drag the row, then open a look to shop it.</p>
          </div>
          <Lookbook looks={looks} pieces={pieces} />
        </section>

        <section className="statement" aria-label="About the niqabs">
          <div className="container grid-12">
            <p className="statement__line" data-reveal suppressHydrationWarning>{words("Every niqab here is black; what changes is the embroidery and the fringe.")}</p>
          </div>
        </section>

        {shade.length > 0 && (
        <section className="colours" id="colours" aria-labelledby="colours-title">
          <div className="container grid-12 section-head" data-reveal suppressHydrationWarning>
            <h2 id="colours-title">Undercaps in fourteen colours</h2>
            <p className="lead">Plain jersey, each shade on the same head so they compare.</p>
          </div>
          <ul className="rail" tabIndex={0} aria-label="Undercap colours">
            {shade.map((c, i) => (
              <li key={c.name} data-reveal suppressHydrationWarning style={{ "--i": i % 6 } as CSSProperties}>
                <Link className="swatch-link" href={`/products/${c.handle}`}>
                  <figure className="swatch">
                    <div data-slot={`undercap-${c.name.toLowerCase()}`} data-alt={`${c.name} jersey undercap on a display head`}>
                      <Image src={c.src} alt={`${c.name} jersey undercap on a display head`} fill sizes="(max-width: 40rem) 42vw, 220px" />
                    </div>
                    <figcaption className="caption">{c.name}</figcaption>
                  </figure>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        )}

        <section className="catalogue container" aria-labelledby="catalogue-title">
          <div className="grid-12 section-head" data-reveal suppressHydrationWarning>
            <h2 id="catalogue-title">From the catalogue</h2>
            <p className="lead">A few of the {count} pieces. Every page of the client&rsquo;s catalogue is in the shop.</p>
          </div>
          <ul className="grid-products">
            {fromCatalogue.map((p, i) => (
              <ProductCard key={p.handle} product={p} index={i} level="h3" />
            ))}
          </ul>
        </section>

        <section className="offer" aria-labelledby="offer-title">
          <div className="container">
            <h2 id="offer-title" data-reveal suppressHydrationWarning>Choose hijabs, niqabs or undercaps</h2>
            <ul className="offer__list">
              {collections.map((c, i) => (
                <li key={c.id} data-reveal suppressHydrationWarning style={{ "--i": i } as CSSProperties}>
                  <Link href={`/collections/${c.id}`}>
                    <span className="offer__name">{c.name}</span>
                    <span>{c.line}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="btn" href="/collections/niqabs">Shop the niqabs</Link>
          </div>
        </section>
      </main>
      <BuyBar />
    </>
  );
}
