import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopPolicy } from "@/lib/commerce";

// Policy pages. Their text comes from the client (and later from Shopify's policy settings);
// until then each page says what it will cover.
const policies = {
  shipping: { title: "Shipping", covers: ["Where Almir delivers", "How long delivery takes", "What delivery costs", "Cash on delivery"] },
  returns: { title: "Returns and exchanges", covers: ["How many days you have", "Which pieces can come back", "How exchanges work", "How refunds are paid"] },
  privacy: { title: "Privacy", covers: ["What the shop collects at checkout", "How it is used", "Who it is shared with, such as the courier"] },
  terms: { title: "Terms", covers: ["Orders and payment", "Prices and stock", "Contacting the shop"] },
} as const;

type Slug = keyof typeof policies;

// Every handle is prerendered from generateStaticParams; the segment may block while params resolve.
export const instant = false;

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const p = policies[(await params).slug as Slug];
  return p ? { title: p.title } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const policy = policies[(await params).slug as Slug];
  if (!policy) notFound();
  const live = await shopPolicy((await params).slug as Slug);
  if (live) {
    return (
      <main id="main" className="prose-page container">
        <div className="grid-12">
          <div className="prose">
            <h1>{live.title}</h1>
            {/* The shop's own policy text, written in the Shopify admin. */}
            <div className="policy-body" dangerouslySetInnerHTML={{ __html: live.body }} />
          </div>
        </div>
      </main>
    );
  }
  return (
    <main id="main" className="prose-page container">
      <div className="grid-12">
        <div className="prose">
          <h1>{policy.title}</h1>
          <p className="lead">
            The shop&rsquo;s own policy text goes here: <span className="fill" data-fill="policy">policy to follow</span>.
          </p>
          <h2 className="prose__head">It will cover</h2>
          <ul className="facts-list">
            {policy.covers.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p>
            Questions in the meantime: <Link href="/contact">contact the shop</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
