import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// The bag, the wishlist and search results are one shopper's own; the rest is open.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/wishlist", "/account", "/search"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
