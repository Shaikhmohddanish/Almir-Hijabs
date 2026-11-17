// Run: node scripts/check-shopify-map.mjs
// Feeds the mapping functions answers shaped like Shopify's and asserts what comes out. Needs Node 22.18 or newer,
// which loads the .ts files directly.
import assert from "node:assert/strict";
import { cartLines, collectionOf, kindOf, toGarment, toProduct } from "../lib/shopify-map.ts";
import { formatMoney, priceLabel } from "../lib/money.ts";

const inr = (amount) => ({ amount, currencyCode: "INR" });
const variant = (id, title, price, extra = {}) => ({ id, title, availableForSale: true, price: inr(price), compareAtPrice: null, selectedOptions: [], image: null, ...extra });
const node = (extra) => ({
  handle: "queen-niqab",
  title: "Queen niqab",
  description: "A tie-back niqab with “Queen” in silver. Catalogue design A18 Black",
  descriptionHtml: "<p>A tie-back niqab with “Queen” in silver.</p><ul><li>Catalogue design A18</li><li>Black &amp; plain</li><li>Tie-back</li></ul>",
  availableForSale: true,
  tags: [],
  seo: { description: null },
  featuredImage: { url: "https://cdn.shopify.com/q.webp", altText: null },
  priceRange: { minVariantPrice: inr("1299.0"), maxVariantPrice: inr("1299.0") },
  options: [{ name: "Title", values: ["Default Title"] }],
  variants: { nodes: [variant("gid://v/1", "Default Title", "1299.0")] },
  collections: { nodes: [{ handle: "niqabs" }] },
  ...extra,
});

// A product with no choices: no options, no variants list, details and design read from the description.
const plain = toProduct(
  node({
    media: {
      nodes: [
        { mediaContentType: "IMAGE", image: { url: "https://cdn.shopify.com/a.webp", altText: "front" } },
        { mediaContentType: "VIDEO", sources: [{ url: "https://cdn.shopify.com/v.webm", mimeType: "video/webm" }, { url: "https://cdn.shopify.com/v.mp4", mimeType: "video/mp4" }], previewImage: { url: "https://cdn.shopify.com/p.jpg" } },
      ],
    },
  }),
);
assert.equal(plain.options, undefined);
assert.equal(plain.variants, undefined);
assert.equal(plain.variantId, "gid://v/1");
assert.equal(plain.description, "A tie-back niqab with “Queen” in silver.");
assert.deepEqual(plain.details, ["Catalogue design A18", "Black & plain", "Tie-back"]);
assert.equal(plain.design, "A18");
assert.equal(plain.summary, "A tie-back niqab with “Queen” in silver.");
assert.equal(plain.kind, "cutout");
assert.equal(plain.maxPrice, undefined);
assert.equal(plain.gallery.length, 1);
assert.deepEqual(plain.video, { src: "https://cdn.shopify.com/v.mp4", type: "video/mp4", poster: "https://cdn.shopify.com/p.jpg" });

// A product with no choices keeps its struck-through price, but only when it really is higher.
const reduced = toProduct(node({ variants: { nodes: [variant("gid://v/2", "Default Title", "1299.0", { compareAtPrice: inr("1599.0") })] } }));
assert.equal(reduced.compareAt.amount, "1599.0");
assert.equal(toProduct(node({ variants: { nodes: [variant("gid://v/3", "Default Title", "1299.0", { compareAtPrice: inr("1299.0") })] } })).compareAt, undefined);
assert.equal(plain.compareAt, undefined);

// Choices: an undercap in colours, one of them sold out. The collection decides the picture frame.
const caps = toProduct(
  node({
    handle: "jersey-undercap",
    title: "Plain jersey undercap",
    seo: { description: "Fourteen colours" },
    options: [{ name: "Colour", values: ["White", "Black"] }],
    collections: { nodes: [{ handle: "undercaps" }] },
    priceRange: { minVariantPrice: inr("299.0"), maxVariantPrice: inr("349.0") },
    variants: {
      nodes: [
        variant("gid://v/10", "White", "299.0", { selectedOptions: [{ name: "Colour", value: "White" }], image: { url: "https://cdn.shopify.com/w.jpg", altText: null } }),
        variant("gid://v/11", "Black", "349.0", { availableForSale: false, selectedOptions: [{ name: "Colour", value: "Black" }], compareAtPrice: inr("399.0") }),
      ],
    },
  }),
);
assert.equal(caps.kind, "grey");
assert.equal(caps.optionName, "Colour");
assert.equal(caps.summary, "Fourteen colours");
assert.equal(caps.variants.length, 2);
assert.deepEqual(caps.variants[0].options, [{ name: "Colour", value: "White" }]);
assert.equal(caps.variants[0].compareAt, undefined);
assert.equal(caps.variants[1].available, false);
assert.equal(caps.variants[1].compareAt.amount, "399.0");
assert.equal(caps.price.amount, "299.0");
assert.equal(caps.maxPrice.amount, "349.0");
assert.equal(priceLabel(caps), "From ₹299");
assert.equal(priceLabel(plain), "₹1,299");

// A tag overrides the frame; a product in no known collection falls back to the one asked for.
assert.equal(kindOf(["kind:studio"], "niqabs"), "studio");
assert.equal(kindOf(["kind:nonsense"], "undercaps"), "grey");
assert.equal(collectionOf(["frontpage", "hijabs"], "niqabs"), "hijabs");
assert.equal(collectionOf(["frontpage"], "undercaps"), "undercaps");

// The rail piece: the small image when asked for, the design code as its tag.
const garment = toGarment(node({ railImage: { url: "https://cdn.shopify.com/q-small.webp" } }));
assert.equal(garment.id, "queen-niqab");
assert.equal(garment.image, "https://cdn.shopify.com/q-small.webp");
assert.equal(garment.tag, "A18");
assert.equal(garment.variantId, "gid://v/1");
assert.equal(toGarment(node({})).image, "https://cdn.shopify.com/q.webp");

// Money in Indian grouping.
assert.equal(formatMoney(inr("1299.0")), "₹1,299");
assert.equal(formatMoney(inr("1299.5")), "₹1,299.50");
assert.equal(formatMoney(inr("125000")), "₹1,25,000");

// The bag: Shopify's lines become the bag's lines, undercaps framed as grey, "Default Title" hidden.
const lines = cartLines({
  id: "gid://cart/1",
  checkoutUrl: "https://shop.example/cart/c/1",
  totalQuantity: 3,
  cost: { subtotalAmount: inr("897.0"), totalAmount: inr("897.0") },
  lines: {
    nodes: [
      { id: "gid://line/1", quantity: 3, cost: { totalAmount: inr("897.0") }, merchandise: { id: "gid://v/10", title: "White", availableForSale: true, image: { url: "https://cdn.shopify.com/w.jpg" }, product: { handle: "jersey-undercap", title: "Plain jersey undercap", tags: [], collections: { nodes: [{ handle: "undercaps" }] } } } },
      { id: "gid://line/2", quantity: 1, cost: { totalAmount: inr("1299.0") }, merchandise: { id: "gid://v/1", title: "Default Title", availableForSale: true, image: null, product: { handle: "queen-niqab", title: "Queen niqab", tags: ["kind:studio"], collections: { nodes: [{ handle: "niqabs" }] } } } },
    ],
  },
});
assert.equal(lines[0].kind, "grey");
assert.equal(lines[0].variant, "White");
assert.equal(lines[0].total.amount, "897.0");
assert.equal(lines[1].kind, "studio");
assert.equal(lines[1].variant, undefined);
assert.equal(lines[1].merchandiseId, "gid://v/1");

console.log("shopify-map: all checks passed");
