import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "Almir Hijabs sells niqabs, hijabs and undercaps." };

export default function AboutPage() {
  return (
    <main id="main" className="prose-page container">
      <div className="grid-12">
        <div className="prose">
          <h1>About Almir</h1>
          <p className="lead">Almir Hijabs sells black niqabs with embroidery and fringe, satin hijabs and jersey and lace undercaps.</p>
          <p>
            The shop&rsquo;s own story, in the owner&rsquo;s words, goes here: <span className="fill" data-fill="story">story to follow</span>.
          </p>
          <p>
            Start with the <Link href="/collections/niqabs">niqabs</Link>, the <Link href="/collections/hijabs">hijabs</Link> or the <Link href="/collections/undercaps">undercaps</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}
