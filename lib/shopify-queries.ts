// Storefront API operations as plain strings. They import nothing, so a script can load this file on its own
// and check every one against Shopify's published schema without a store or a running app.
const MONEY = "amount currencyCode";
const PAGE = "pageInfo { hasNextPage endCursor }";

// What a card or a list needs from a product.
const CARD = `handle title description availableForSale tags seo { description } featuredImage { url altText } priceRange { minVariantPrice { ${MONEY} } maxVariantPrice { ${MONEY} } } options { name values } variants(first: 30) { nodes { id title availableForSale price { ${MONEY} } compareAtPrice { ${MONEY} } selectedOptions { name value } image { url altText } } } collections(first: 5) { nodes { handle } }`;

// The product page adds the formatted description, every photo and any video, and the optional back photo.
const FULL = `descriptionHtml media(first: 20) { nodes { mediaContentType ... on MediaImage { image { url altText } } ... on Video { sources { url mimeType } previewImage { url } } } } backImage: metafield(namespace: "custom", key: "back_image") { reference { ... on MediaImage { image { url } } } }`;

export const COLLECTION_PRODUCTS = `query CollectionProducts($handle: String!, $after: String) { collection(handle: $handle) { products(first: 50, after: $after) { ${PAGE} nodes { ${CARD} } } } }`;
export const COLLECTION_INFO = `query CollectionInfo($handle: String!) { collection(handle: $handle) { title description } }`;
// The home page rail: the manual collection "hero-rail", in the order the shop set, with a small cut-out for each piece.
export const RAIL = `query Rail($handle: String!) { collection(handle: $handle) { products(first: 30) { nodes { ${CARD} descriptionHtml railImage: featuredImage { url(transform: { maxWidth: 640 }) } } } } }`;
export const PRODUCT = `query Product($handle: String!) { product(handle: $handle) { ${CARD} ${FULL} } }`;
export const SEARCH = `query Search($q: String!) { search(query: $q, types: PRODUCT, first: 60) { nodes { ... on Product { ${CARD} } } } }`;
export const PRODUCT_HANDLES = `query Handles($after: String) { products(first: 250, after: $after) { ${PAGE} nodes { handle } } }`;
export const POLICIES = `query Policies { shop { shippingPolicy { title body } refundPolicy { title body } privacyPolicy { title body } termsOfService { title body } } }`;

// Shopify owns the cart and its checkout; the app only shows it.
const CART = `id checkoutUrl totalQuantity cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } } lines(first: 100) { nodes { id quantity cost { totalAmount { ${MONEY} } } merchandise { ... on ProductVariant { id title availableForSale image { url } product { handle title tags collections(first: 5) { nodes { handle } } } } } } }`;
const RESULT = `cart { ${CART} } userErrors { message } warnings { message }`;

export const CART_GET = `query Cart($id: ID!) { cart(id: $id) { ${CART} } }`;
export const CART_CREATE = `mutation CartCreate($lines: [CartLineInput!]) { cartCreate(input: { lines: $lines }) { ${RESULT} } }`;
export const CART_ADD = `mutation CartAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { ${RESULT} } }`;
export const CART_UPDATE = `mutation CartUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { ${RESULT} } }`;
export const CART_REMOVE = `mutation CartRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { ${RESULT} } }`;
