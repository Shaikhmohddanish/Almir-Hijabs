// The store's catalogue, taken from the client's PDFs (docs/product-inventory.md).
// Replaced by Shopify Storefront API data once the store exists. Product names marked
// "descriptive" are ours until the client confirms their own. No prices: none were given.
import type { RailGarment } from "@/components/ui/product-rail-gallery";
import { generatedProducts, railAspect } from "./catalog-generated";

export type CollectionId = "hijabs" | "niqabs" | "undercaps";
// cutout: transparent image · studio: white background, blended into the paper · grey: grey studio photo
export type ImageKind = "cutout" | "studio" | "grey";

export type Money = { amount: string; currencyCode: string };
// One buyable variant. `name` is the variant's title; `options` is its choice for each option (Colour: Black).
export type Variant = { name: string; image?: string; id?: string; options?: { name: string; value: string }[]; price?: Money; compareAt?: Money; available?: boolean };
export type Product = {
  handle: string;
  name: string;
  collection: CollectionId;
  summary: string;
  description: string;
  details: string[];
  image?: string;
  kind?: ImageKind;
  variants?: Variant[];
  optionName?: string;
  variantId?: string;
  price?: Money;
  // Only products read from Shopify carry these.
  maxPrice?: Money;
  // The struck-through price of a product with no choices; with choices each variant has its own.
  compareAt?: Money;
  options?: { name: string; values: string[] }[];
  available?: boolean;
  descriptionHtml?: string;
  gallery?: { url: string; alt?: string }[];
  video?: { src: string; type?: string; poster?: string };
  backImage?: string;
  design?: string;
};

export type Collection = { id: CollectionId; name: string; line: string; intro: string };

export const collections: Collection[] = [
  { id: "hijabs", name: "Hijabs", line: "Satin, crushed satin and printed stoles", intro: "Stoles in satin, crushed satin and print. Photographs are on their way from the client." },
  { id: "niqabs", name: "Niqabs", line: "Plain, embroidered and fringed, all in black", intro: "Every niqab is black; the band, the embroidery and the fringe set them apart." },
  { id: "undercaps", name: "Undercaps", line: "Jersey and lace, in many colours", intro: "Plain jersey in fourteen colours, lace bands in ten, and more cuts from the catalogue." },
];

const jersey = ["white", "cream", "mustard", "red", "plum", "blue", "sage", "mint", "pistachio", "olive", "stone", "grey", "charcoal", "black"];
const lace = ["black-gold", "grey-blue", "blue", "purple", "teal", "silver", "navy", "pink", "charcoal", "red"];
const title = (s: string) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

const namedProducts: Product[] = [
  // niqabs
  { handle: "queen-niqab", name: "Queen niqab", collection: "niqabs", image: "/rail/niqab-queen.webp", kind: "cutout", summary: "“Queen” in silver on the band", description: "A tie-back niqab with “Queen” embroidered in silver across the band and a long veil.", details: ["Catalogue design A18", "Black", "Tie-back", "Silver embroidery on the band"] },
  { handle: "shahzadi-niqab", name: "Shahzadi niqab", collection: "niqabs", image: "/rail/niqab-shahzadi.webp", kind: "cutout", summary: "“Shahzadi” and a crown in gold", description: "A tie-back niqab with “Shahzadi” and a small crown embroidered in gold on the band.", details: ["Catalogue design A20", "Black", "Tie-back", "Gold embroidery on the band"] },
  { handle: "calligraphy-niqab-silver", name: "Calligraphy niqab, silver", collection: "niqabs", image: "/rail/niqab-silver-calligraphy.webp", kind: "cutout", summary: "Silver calligraphy across the band", description: "Calligraphy in silver thread runs across the band; the veil falls long below it.", details: ["Catalogue design A21", "Black", "Tie-back", "Silver thread"] },
  { handle: "calligraphy-niqab-gold", name: "Calligraphy niqab, gold", collection: "niqabs", image: "/rail/niqab-gold-calligraphy.webp", kind: "cutout", summary: "Gold calligraphy across the band", description: "Calligraphy in gold thread runs across the band; the veil falls long below it.", details: ["Catalogue design A24", "Black", "Tie-back", "Gold thread"] },
  { handle: "charm-tie-niqab", name: "Charm tie niqab", collection: "niqabs", image: "/rail/niqab-charm-ties.webp", kind: "cutout", summary: "Gold charms on the ties", description: "A tie-back niqab whose ties end in small gold charms.", details: ["Catalogue design A30", "Black", "Tie-back", "Gold charms"] },
  { handle: "plain-niqab-long", name: "Plain niqab, long veil", collection: "niqabs", image: "/rail/niqab-long-plain.webp", kind: "cutout", summary: "A plain band and a long veil", description: "No embroidery at all: a plain band, long ties and a long veil.", details: ["Catalogue design A04", "Black", "Tie-back", "Long veil"] },
  { handle: "gold-flower-niqab", name: "Gold flower niqab", collection: "niqabs", image: "/photos/niqab-gold-flower.webp", kind: "cutout", summary: "A gold flower on the band", description: "A gold embroidered flower sits on the band, and a fine gold piping runs down the veil.", details: ["Black", "Gold flower embroidery", "Gold piping on the veil"] },
  { handle: "gold-flower-niqab-short", name: "Gold flower niqab, short", collection: "niqabs", image: "/products/niqab-gold-flower-short.webp", kind: "cutout", summary: "The gold flower on a shorter veil", description: "The same gold flower on the band, over a shorter veil.", details: ["Black", "Gold flower embroidery", "Short veil"] },
  { handle: "v-hem-niqab", name: "V hem niqab", collection: "niqabs", image: "/photos/niqab-v-fringe.jpg", kind: "studio", summary: "Beads along a V-shaped hem", description: "The veil comes to a point, with black beads hanging along the V-shaped hem.", details: ["Black", "Beaded V hem"] },
  { handle: "short-fringe-niqab", name: "Short fringe niqab", collection: "niqabs", image: "/photos/niqab-fringe-camel.webp", kind: "cutout", summary: "Bead fringe on a short veil", description: "A short veil finished with a bead fringe; shown over a camel undercap.", details: ["Black", "Bead fringe", "Short veil"] },
  { handle: "niqab-over-teal", name: "Niqab over teal", collection: "niqabs", image: "/photos/niqab-teal-undercap.webp", kind: "cutout", summary: "Shown over a teal undercap", description: "A black niqab photographed over a teal undercap.", details: ["Black", "Shown with a teal undercap"] },
  { handle: "bead-v-niqab", name: "Bead V niqab", collection: "niqabs", image: "/products/niqab-bead-v.webp", kind: "cutout", summary: "Beads along a V edge", description: "A tie-back niqab with a V-shaped edge lined with beads.", details: ["Tie-back", "Beaded V edge"] },
  { handle: "tassel-fringe-niqab", name: "Tassel fringe niqab", collection: "niqabs", image: "/products/niqab-tassel-fringe.webp", kind: "cutout", summary: "Tassels along the hem", description: "A tie-back niqab with small tassels along a slanted hem.", details: ["Black", "Tie-back", "Tassel hem"] },
  { handle: "gold-panel-niqab", name: "Gold panel niqab", collection: "niqabs", image: "/products/niqab-gold-panel.webp", kind: "cutout", summary: "A gold embroidered panel", description: "A triangle of gold embroidery and beads sits on the veil.", details: ["Black", "Gold embroidery"] },
  { handle: "floral-niqab", name: "Floral embroidery niqab", collection: "niqabs", image: "/products/niqab-floral-embroidery.webp", kind: "cutout", summary: "Rose-gold flowers on the veil", description: "Rose-gold flowers and leaves are embroidered across the veil.", details: ["Black", "Floral embroidery"] },
  { handle: "chain-niqab", name: "Chain embroidery niqab", collection: "niqabs", image: "/products/niqab-chain-embroidery.webp", kind: "cutout", summary: "Silver scrolls and chains", description: "Silver scroll embroidery with hanging chain loops along the top of the veil.", details: ["Black", "Silver embroidery"] },
  { handle: "bedoon", name: "Bedoon", collection: "niqabs", summary: "Size 7×12", description: "Listed in the catalogue as Bedoon, size 7×12.", details: ["Size 7×12"] },
  { handle: "double-palla-v-crystal", name: "Double palla V crystal", collection: "niqabs", summary: "Size 9×12", description: "Listed in the catalogue as Double palla V crystal, size 9×12.", details: ["Size 9×12"] },
  { handle: "crystal-fringe-niqabs", name: "Crystal fringe niqabs", collection: "niqabs", summary: "Zig Zag, Diamond, Dubai and Africa designs", description: "A range of niqabs finished with crystal fringes, each design named in the catalogue.", details: ["Crystal fringe"], optionName: "Design", variants: ["Zig Zag", "Diamond", "Dubai Crystal 5", "Africa", "Rose Paan", "Salli", "Stick", "White Fancy"].map((name) => ({ name })) },
  // hijabs (no photographs yet)
  { handle: "jio-satin-crush", name: "Jio Satin Crush", collection: "hijabs", summary: "Crushed satin in a range of colours", description: "A crushed satin stole, shown by the supplier in a range of colours.", details: ["Crushed satin"] },
  { handle: "premium-hijab-stole", name: "Premium Hijab Stole", collection: "hijabs", summary: "Embroidered stole in a grid of colours", description: "An embroidered stole, shown by the supplier in a grid of colours.", details: ["Embroidered"] },
  { handle: "crystal-border-satin", name: "Satin with crystal border", collection: "hijabs", summary: "A line of crystals along one edge", description: "Satin stoles with a line of crystals along one edge.", details: ["Satin", "Crystal border"] },
  { handle: "printed-satin", name: "Printed satin", collection: "hijabs", summary: "Satin with an all-over print", description: "Satin stoles with an all-over print.", details: ["Satin", "Printed"] },
  // undercaps
  { handle: "jersey-undercap", name: "Plain jersey undercap", collection: "undercaps", kind: "grey", summary: "Fourteen colours", description: "A plain jersey undercap, photographed in each of its fourteen colours on the same display head.", details: ["Jersey", "Fourteen colours"], optionName: "Colour", variants: jersey.map((c) => ({ name: title(c), image: `/photos/undercap-${c}.jpg` })) },
  { handle: "lace-undercap", name: "Lace band undercap", collection: "undercaps", kind: "grey", summary: "Lace across the front, ten colours", description: "An undercap with a wide lace band across the forehead.", details: ["Lace band", "Ten colours"], optionName: "Colour", variants: lace.map((c) => ({ name: title(c).replace("Black Gold", "Black and gold").replace("Grey Blue", "Grey blue"), image: `/products/undercap-lace-${c}.jpg` })) },
  { handle: "twist-front-undercap", name: "Twist-front undercap", collection: "undercaps", image: "/products/undercap-twist-white.jpg", kind: "grey", summary: "Fabric crossed over the forehead", description: "The fabric crosses over itself at the front.", details: ["Twist front"] },
  { handle: "tie-back-bonnet", name: "Tie-back bonnet", collection: "undercaps", image: "/products/undercap-bonnet-white.jpg", kind: "grey", summary: "Ties at the nape", description: "A bonnet that ties at the nape of the neck.", details: ["Ties at the back"] },
  { handle: "bandana-undercap", name: "Bandana undercap", collection: "undercaps", image: "/products/undercap-bandana-charcoal.jpg", kind: "grey", summary: "A triangle at the back", description: "An undercap with a triangle of fabric at the back, like a bandana.", details: ["Bandana back"] },
];

export const products: Product[] = [...namedProducts, ...generatedProducts];

export const getCollection = (id: string) => collections.find((c) => c.id === id);
export const getProduct = (handle: string) => products.find((p) => p.handle === handle);
export const productsIn = (id: CollectionId) => products.filter((p) => p.collection === id);
export const imageOf = (p: Product, variant = 0) => p.variants?.[variant]?.image ?? p.image;

// Homepage: the rail, the lookbook and the shade card draw from the same catalogue.
const railNamed: [string, string][] = [["queen-niqab", "A18"], ["calligraphy-niqab-silver", "A21"], ["plain-niqab-long", "A04"], ["charm-tie-niqab", "A30"], ["calligraphy-niqab-gold", "A24"], ["shahzadi-niqab", "A20"]];
const railCodes = Object.entries(railAspect).filter(([, a]) => a >= 1).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([c]) => c);
export const railNiqabs: RailGarment[] = [
  ...railNamed.map(([h, tag]) => ({ h, tag })),
  ...railCodes.map((c) => ({ h: `niqab-design-${c.toLowerCase()}`, tag: c })),
]
  .map(({ h, tag }) => ({ p: getProduct(h)!, tag }))
  .sort((a, b) => a.tag.localeCompare(b.tag))
  .map(({ p, tag }) => ({ id: p.handle, name: p.name, image: `/rail/small/${p.image!.split("/").pop()}`, description: p.description, details: p.details, tag }));

export const undercapColours = jersey.map((c) => ({ name: title(c), src: `/photos/undercap-${c}.jpg`, handle: "jersey-undercap" }));

export type Look = {
  src: string;
  soft: string;
  alt: string;
  title: string;
  step: string;
  handle: string;
  pins: { x: number; y: number; label: string }[];
};
// Every look pairs its niqab with the plain jersey undercap (a pairing, not a claim about the photo).
export const lookPairing = "jersey-undercap";

export const looks: Look[] = [
  { src: "/looks/gold-flower.webp", soft: "/looks/gold-flower-soft.webp", alt: "Black niqab with a gold embroidered flower on the band, on a display head", title: "Gold flower", step: "Gold flower", handle: "gold-flower-niqab", pins: [{ x: 44, y: 19, label: "Gold flower on the band" }] },
  { src: "/looks/b22.webp", soft: "/looks/b22-soft.webp", alt: "Black niqab with beads along a V-shaped hem, on a display head", title: "Beaded V hem", step: "V hem", handle: "niqab-design-b22", pins: [{ x: 64, y: 82, label: "Beads along the V hem" }] },
  { src: "/looks/short-fringe.webp", soft: "/looks/short-fringe-soft.webp", alt: "Short black niqab with a bead fringe, over a camel undercap", title: "Short fringe", step: "Fringe", handle: "short-fringe-niqab", pins: [{ x: 58, y: 88, label: "Bead fringe on the hem" }, { x: 55, y: 8, label: "Undercap beneath" }] },
  { src: "/looks/teal.webp", soft: "/looks/teal-soft.webp", alt: "Black niqab over a teal undercap, on a display head", title: "Over teal", step: "Teal", handle: "niqab-over-teal", pins: [{ x: 50, y: 55, label: "The niqab" }, { x: 50, y: 8, label: "Teal undercap beneath" }] },
  { src: "/looks/b08.webp", soft: "/looks/b08-soft.webp", alt: "Black niqab with calligraphy embroidered on the band, on a display head", title: "Calligraphy band", step: "Calligraphy", handle: "niqab-design-b08", pins: [{ x: 50, y: 20, label: "Calligraphy on the band" }] },
  { src: "/looks/b13.webp", soft: "/looks/b13-soft.webp", alt: "Plain black niqab over a camel undercap, on a display head", title: "Plain over camel", step: "Plain", handle: "niqab-design-b13", pins: [{ x: 50, y: 65, label: "Plain veil" }, { x: 50, y: 7, label: "Undercap beneath" }] },
  { src: "/looks/b17.webp", soft: "/looks/b17-soft.webp", alt: "Long black niqab over a camel undercap, on a display head", title: "Long veil", step: "Long veil", handle: "niqab-design-b17", pins: [{ x: 50, y: 62, label: "Long veil" }, { x: 50, y: 6, label: "Undercap beneath" }] },
  { src: "/looks/b25.webp", soft: "/looks/b25-soft.webp", alt: "Black niqab with a bead fringe, on a display head", title: "Bead fringe", step: "Bead fringe", handle: "niqab-design-b25", pins: [{ x: 56, y: 90, label: "Bead fringe" }] },
];
