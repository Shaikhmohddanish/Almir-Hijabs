// One-off: loads the shop's catalogue into a Shopify store through the Shopify CLI's own sign-in, so no token is ever handled.
//   npx tsx@4.23.15 scripts/shopify/import.mjs --store <name>.myshopify.com [mode]
// Modes (none means --check):
//   --check            the sign-in and the store's name, currency and Headless channel; nothing is changed
//   --dry              what --run would send; needs no store
//   --run              create the collections and the products that are missing. Safe to run again: existing handles are skipped
//   --only a,b         limit --run to some handles, to try one or two first
//   --sheet            write docs/product-sheet.csv, for the client's real prices
//   --prices <csv>     put the prices from the sheet in and drop the test-price tag
// Sign in first: shopify store auth --store <name>.myshopify.com --scopes <the list in the plan>
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collections, products, railNiqabs } from "../../app/catalog.ts";
import { collectionInput, imagesOf, parseCsv, placeholderPrice, productInput, sheetCsv } from "./build.mjs";
import * as Q from "./queries.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (flag(name) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const store = option("store") ?? process.env.SHOPIFY_FLAG_STORE;
const root = fileURLToPath(new URL("../../", import.meta.url));
const publicFile = (path) => join(root, "public", path);
const mimeOf = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
const RAIL = "hero-rail";
const railHandles = railNiqabs.map((g) => g.id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fail(message) {
  console.error(message);
  process.exit(1);
}

// The API version every operation here was checked against. Without it the CLI uses Shopify's "unstable" version.
const API_VERSION = "2026-10";
const DROPPED = /ETIMEDOUT|ECONNRESET|ECONNREFUSED|EAI_AGAIN|ENOTFOUND|socket hang up/i;

// One call to the store through the Shopify CLI. The CLI refuses a mutation unless it is told to allow it.
// A throttled call never ran, so it is always repeated. A dropped connection is repeated only where repeating is safe
// (reads, publishing, upload requests); creating something is not, since the first attempt may have gone through.
async function run(query, variables = {}, { mutation = false, retry = !mutation } = {}) {
  for (let attempt = 0; ; attempt++) {
    const dir = mkdtempSync(join(tmpdir(), "almir-shopify-"));
    writeFileSync(join(dir, "query.graphql"), query);
    writeFileSync(join(dir, "variables.json"), JSON.stringify(variables));
    const cli = ["store", "execute", "--store", store, "--version", API_VERSION, "--query-file", join(dir, "query.graphql"), "--variable-file", join(dir, "variables.json"), "--json", "--no-input", ...(mutation ? ["--allow-mutations"] : [])];
    const r = spawnSync("shopify", cli, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, SHOPIFY_CLI_NO_ANALYTICS: "1" } });
    rmSync(dir, { recursive: true, force: true });
    const text = `${r.stdout}${r.stderr}`;
    if ((/throttled/i.test(text) || (retry && r.status !== 0 && DROPPED.test(text))) && attempt < 4) {
      console.log(`  (the store didn't answer; trying again in ${3 * (attempt + 1)}s)`);
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (r.status !== 0) fail(`shopify store execute failed:\n${text.trim().slice(0, 800)}\nIt is safe to run the same command again: products already in the store are skipped.`);
    const out = JSON.parse(r.stdout.slice(r.stdout.indexOf("{"), r.stdout.lastIndexOf("}") + 1));
    if (out.errors?.length) fail(`Shopify answered with errors: ${JSON.stringify(out.errors).slice(0, 800)}`);
    return out.data ?? out;
  }
}
const mutate = (query, variables, retry = false) => run(query, variables, { mutation: true, retry });

function noErrors(label, payload) {
  const errors = payload?.userErrors ?? [];
  if (errors.length) fail(`${label}: ${errors.map((e) => e.message).join("; ")}`);
  return payload;
}

async function headlessPublication() {
  const nodes = (await run(Q.PUBLICATIONS)).publications.nodes;
  const named = option("publication");
  const hit = named ? nodes.find((n) => n.id === named || n.name === named) : nodes.find((n) => /headless/i.test(`${n.app.title} ${n.name}`));
  if (!hit) fail(`No Headless channel found. The sales channels here: ${nodes.map((n) => `${n.name} (${n.id})`).join(", ") || "none"}. Install the Headless channel, or pass --publication <name or id>.`);
  return hit;
}

// The four collections the site reads, created if they are not there yet.
async function ensureCollections() {
  const wanted = [...collections.map(collectionInput), { title: "Home page rail", handle: RAIL, descriptionHtml: "<p>The pieces on the home page rail, in this order.</p>", sortOrder: "MANUAL" }];
  const ids = {};
  for (const input of wanted) {
    const found = (await run(Q.COLLECTION, { handle: input.handle })).collectionByIdentifier;
    if (found) ids[input.handle] = found.id;
    else {
      ids[input.handle] = noErrors(`create collection ${input.handle}`, (await mutate(Q.COLLECTION_CREATE, { collection: input })).collectionCreate).collection.id;
      console.log(`created collection ${input.handle}`);
    }
  }
  return ids;
}

// Sends each local picture to the address Shopify names for it, and returns where Shopify now holds it.
async function upload(paths) {
  const urls = {};
  for (let i = 0; i < paths.length; i += 40) {
    const batch = paths.slice(i, i + 40);
    const input = batch.map((path) => ({ resource: "IMAGE", filename: basename(path), mimeType: mimeOf[extname(path).toLowerCase()], httpMethod: "POST" }));
    const targets = noErrors("staged uploads", (await mutate(Q.STAGED_UPLOADS, { input }, true)).stagedUploadsCreate).stagedTargets;
    for (const [k, target] of targets.entries()) {
      // Sending the same file to the same target again is harmless, so a failed upload is tried up to three times.
      for (let attempt = 1; ; attempt++) {
        const form = new FormData();
        for (const { name, value } of target.parameters) form.append(name, value);
        form.append("file", new Blob([readFileSync(publicFile(batch[k]))], { type: input[k].mimeType }), input[k].filename);
        const res = await fetch(target.url, { method: "POST", body: form }).catch((e) => ({ ok: false, status: e.message, text: async () => "" }));
        if (res.ok) break;
        if (attempt === 3) fail(`Uploading ${batch[k]} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
        await sleep(3000 * attempt);
      }
      urls[batch[k]] = target.resourceUrl;
    }
    console.log(`uploaded ${Math.min(i + 40, paths.length)} of ${paths.length} pictures`);
  }
  return urls;
}

async function importCatalogue(publicationId) {
  const ids = await ensureCollections();
  for (const id of Object.values(ids)) noErrors("publish a collection", (await mutate(Q.PUBLISH, { id, input: [{ publicationId }] }, true)).publishablePublish);
  const existing = new Map();
  for (let after = null; ; ) {
    const page = (await run(Q.HANDLES, { after, pub: publicationId })).products;
    page.nodes.forEach((n) => existing.set(n.handle, n));
    if (!page.pageInfo.hasNextPage) break;
    after = page.pageInfo.endCursor;
  }
  // An earlier run that was cut off between creating a product and publishing it leaves it off the site; publish those now.
  for (const p of products) {
    const hit = existing.get(p.handle);
    if (hit && !hit.publishedOnPublication) {
      noErrors(`publish ${p.handle}`, (await mutate(Q.PUBLISH, { id: hit.id, input: [{ publicationId }] }, true)).publishablePublish);
      console.log(`published ${p.handle}, which an earlier run had left unpublished`);
    }
  }
  const only = option("only")?.split(",");
  const todo = products.filter((p) => !existing.has(p.handle) && (!only || only.includes(p.handle)));
  console.log(`${products.length - todo.length} products skipped (already there, or not asked for); ${todo.length} to create`);
  const urls = await upload([...new Set(todo.flatMap(imagesOf))]);
  let done = 0;
  for (const p of todo) {
    const collectionIds = [ids[p.collection], ...(railHandles.includes(p.handle) ? [ids[RAIL]] : [])];
    const made = noErrors(p.handle, (await mutate(Q.PRODUCT_SET, { input: productInput(p, { urls, collectionIds }) })).productSet).product;
    noErrors(`publish ${p.handle}`, (await mutate(Q.PUBLISH, { id: made.id, input: [{ publicationId }] }, true)).publishablePublish);
    console.log(`${++done}/${todo.length} ${p.handle}`);
  }
  // The rail shows its pieces in the order of the catalogue's rail list.
  const railIds = [];
  for (const handle of railHandles) {
    const hit = (await run(Q.PRODUCT_IDS, { handle })).productByIdentifier;
    if (hit) railIds.push(hit.id);
  }
  if (railIds.length) noErrors("reorder the rail", (await mutate(Q.REORDER, { id: ids[RAIL], moves: railIds.map((id, i) => ({ id, newPosition: String(i) })) }, true)).collectionReorderProducts);
  console.log("done");
}

// The client's real prices, from the sheet: set on every variant, and the test-price tag comes off.
async function updatePrices(csvPath) {
  let n = 0;
  for (const row of parseCsv(readFileSync(csvPath, "utf8"))) {
    if (!row.price?.trim()) continue;
    const price = Number(row.price);
    if (!(price > 0)) fail(`${row.handle}: "${row.price}" is not a price`);
    const hit = (await run(Q.PRODUCT_IDS, { handle: row.handle })).productByIdentifier;
    if (!hit) {
      console.warn(`${row.handle}: not in the store, skipped`);
      continue;
    }
    noErrors(`${row.handle} price`, (await mutate(Q.VARIANT_PRICES, { productId: hit.id, variants: hit.variants.nodes.map((v) => ({ id: v.id, price: String(price) })) })).productVariantsBulkUpdate);
    if (hit.tags.includes("test-price")) noErrors(`${row.handle} tag`, (await mutate(Q.TAGS_REMOVE, { id: hit.id, tags: ["test-price"] })).tagsRemove);
    n++;
  }
  console.log(`${n} prices set`);
}

function sheet() {
  const file = join(root, "..", "docs", "product-sheet.csv");
  writeFileSync(file, sheetCsv(products));
  console.log(`wrote ${products.length} rows to ${file}`);
}

function dry() {
  const pictures = [...new Set(products.flatMap(imagesOf))];
  const missing = pictures.filter((path) => !existsSync(publicFile(path)));
  if (missing.length) fail(`Pictures missing from public/: ${missing.join(", ")}`);
  console.log(`${products.length} products, ${pictures.length} pictures (all found in public/), ${collections.length + 1} collections`);
  for (const c of collections) {
    const prices = products.filter((p) => p.collection === c.id).map((p) => placeholderPrice(p.handle, p.collection));
    console.log(`  ${c.id}: ${prices.length} products, placeholder prices ${Math.min(...prices)} to ${Math.max(...prices)}`);
  }
  console.log(`  ${RAIL}: ${railHandles.length} pieces`);
  const example = products.find((p) => p.variants?.length && p.image) ?? products[0];
  const urls = new Proxy({}, { get: (_, path) => `(uploaded) ${String(path)}` });
  console.log(`\nWhat is sent for ${example.handle}:\n${JSON.stringify(productInput(example, { urls, collectionIds: ["(collection id)"] }), null, 1)}`);
}

if (flag("sheet")) sheet();
else if (flag("dry")) dry();
else {
  if (!store) fail("Pass --store <name>.myshopify.com");
  const { shop } = await run(Q.SHOP);
  // Nothing is ever changed in a store other than the one named on the command line.
  if (shop.myshopifyDomain !== store) fail(`The CLI is signed in to ${shop.myshopifyDomain}, not ${store}. Nothing was changed.`);
  console.log(`${shop.name} (${shop.myshopifyDomain}): ${shop.currencyCode}, ${shop.ianaTimezone}, plan ${shop.plan.displayName}`);
  if (shop.currencyCode !== "INR") console.warn("Warning: the store's currency is not INR.");
  const publication = await headlessPublication();
  console.log(`Headless channel: ${publication.name} (${publication.id})`);
  if (flag("run")) await importCatalogue(publication.id);
  else if (option("prices")) await updatePrices(option("prices"));
}
