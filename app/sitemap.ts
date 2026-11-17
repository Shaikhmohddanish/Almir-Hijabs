import type { MetadataRoute } from "next";
import { productHandles } from "@/lib/commerce";
import { site } from "@/lib/site";
import { collections } from "./catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/about", "/contact", ...collections.map((c) => `/collections/${c.id}`), ...(await productHandles()).map((h) => `/products/${h}`)];
  return paths.map((path) => ({ url: `${site.url}${path}` }));
}
