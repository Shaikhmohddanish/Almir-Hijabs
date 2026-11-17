import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Product photos come from Shopify's CDN once the store is connected.
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }] },
};

export default nextConfig;
