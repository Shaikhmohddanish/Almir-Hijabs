import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", description: "How to reach Almir Hijabs." };

export default function ContactPage() {
  return (
    <main id="main" className="prose-page container">
      <div className="grid-12">
        <div className="prose">
          <h1>Contact</h1>
          <p className="lead">Questions about a style, a colour or an order go straight to the shop.</p>
          <ul className="facts-list">
            <li>
              <span className="facts-list__label">WhatsApp and phone</span>{" "}
              {site.phone ? <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a> : <span className="fill" data-fill="phone">number to follow</span>}
              {site.whatsapp && (
                <>
                  {" "}
                  <a href={`https://wa.me/${site.whatsapp}`}>Message on WhatsApp</a>
                </>
              )}
            </li>
            <li>
              <span className="facts-list__label">Email</span>{" "}
              {site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : <span className="fill" data-fill="email">address to follow</span>}
            </li>
            {site.instagram && (
              <li>
                <span className="facts-list__label">Instagram</span> <a href={site.instagram}>{site.instagram.replace(/^https?:\/\/(www\.)?/, "")}</a>
              </li>
            )}
          </ul>
          <p>Shipping and returns are set out on their own pages: <Link href="/policies/shipping">shipping</Link> and <Link href="/policies/returns">returns</Link>.</p>
        </div>
      </div>
    </main>
  );
}
