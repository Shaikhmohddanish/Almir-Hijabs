import type { Metadata } from "next";
import { collectionProducts } from "@/lib/commerce";
import CartView from "../components/CartView";

export const metadata: Metadata = { title: "Your bag", description: "The pieces you have added, ready for checkout." };

export default async function CartPage() {
  const suggestions = (await collectionProducts("niqabs")).slice(0, 4);
  return (
    <main id="main" className="cart container">
      <h1 className="cart__title">Your bag</h1>
      <CartView suggestions={suggestions} />
    </main>
  );
}
