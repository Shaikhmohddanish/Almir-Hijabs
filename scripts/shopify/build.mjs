// What a catalogue product looks like when it is sent to Shopify. Pure: no network, no files.
export const VENDOR = "Almir Hijabs";
const range = { niqabs: [899, 2999], hijabs: [499, 1499], undercaps: [199, 499] };
const type = { niqabs: "Niqab", hijabs: "Hijab", undercaps: "Undercap" };
const defaultKind = { niqabs: "cutout", hijabs: "cutout", undercaps: "grey" };
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// A placeholder price: the same on every run for a handle, in whole hundreds, inside its collection's range.
export function placeholderPrice(handle, collection) {
  const [lo, hi] = range[collection];
  return lo + (hash(handle) % (Math.floor((hi - lo) / 100) + 1)) * 100;
}

// The written description: a paragraph, then the facts as a list. The shop can reformat it freely in the Shopify admin.
export const descriptionHtml = (p) => `<p>${esc(p.description)}</p>${p.details.length ? `<ul>${p.details.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : ""}`;

// Every local picture a product uses, once each: its main photograph, then one per variant.
export const imagesOf = (p) => [...new Set([p.image, ...(p.variants ?? []).map((v) => v.image)].filter(Boolean))];

// The ProductSetInput for a new product. `urls` maps a local picture path to the address Shopify gave it after the upload;
// `collectionIds` are the collections the product joins.
export function productInput(p, { urls, collectionIds }) {
  const price = String(placeholderPrice(p.handle, p.collection));
  const file = (path, alt) => ({ originalSource: urls[path], contentType: "IMAGE", alt });
  // A product with no choices still needs one option in Shopify: "Title: Default Title".
  const option = p.variants?.length ? (p.optionName ?? "Option") : "Title";
  const named = p.variants?.length ? p.variants : [{ name: "Default Title" }];
  return {
    handle: p.handle,
    title: p.name,
    descriptionHtml: descriptionHtml(p),
    vendor: VENDOR,
    productType: type[p.collection],
    status: "ACTIVE",
    // test-price marks a placeholder price; the launch gate is that no product carries it. kind:* only where it differs from the collection's usual picture frame.
    tags: ["test-price", ...(p.kind && p.kind !== defaultKind[p.collection] ? [`kind:${p.kind}`] : [])],
    seo: { description: p.summary },
    collections: collectionIds,
    files: imagesOf(p).map((path) => file(path, p.name)),
    productOptions: [{ name: option, values: named.map((v) => ({ name: v.name })) }],
    variants: named.map((v) => ({
      optionValues: [{ optionName: option, name: v.name }],
      price,
      // Not counted in stock: a piece is always buyable until the shop turns stock tracking on.
      inventoryItem: { tracked: false },
      ...(v.image ? { file: file(v.image, `${p.name}, ${v.name}`) } : {}),
    })),
  };
}

// The sheet the client fills in. The placeholder prices are shown for reference; the real ones go in the last column.
export function sheetCsv(products) {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = products.map((p) => [p.handle, p.name, p.collection, /Catalogue design ([A-Z]\d+)/.exec(p.details.join(" "))?.[1] ?? "", (p.variants ?? []).map((v) => v.name).join("; "), placeholderPrice(p.handle, p.collection), ""].map(q).join(","));
  return `${["handle,name,collection,design,colours or sizes,placeholder price,price", ...rows].join("\n")}\n`;
}

// Reads a sheet back as rows keyed by its header. Handles quoted fields with commas, quotes and line breaks.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  const [head, ...rest] = rows;
  return rest.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
}

export const collectionInput = (c) => ({ title: c.name, handle: c.id, descriptionHtml: `<p>${esc(c.intro)}</p>`, sortOrder: "MANUAL" });
