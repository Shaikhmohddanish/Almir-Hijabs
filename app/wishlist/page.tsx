import type { Metadata } from "next";
import { allProducts } from "@/lib/commerce";
import { cardOf } from "@/lib/shopify-map";
import { WishlistView } from "../components/StoreViews";

export const metadata: Metadata = { title: "Wishlist", description: "Pieces you have saved." };

export default async function WishlistPage() {
  const products = (await allProducts()).map(cardOf);
  return (
    <main id="main" className="container store-page">
      <h1 className="store-page__title" data-reveal suppressHydrationWarning>Wishlist</h1>
      <WishlistView products={products} />
    </main>
  );
}
