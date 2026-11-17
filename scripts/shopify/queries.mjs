// Admin API operations for the catalogue import. Strings only, so a checker can validate each one against Shopify's schema.
export const SHOP = `query Shop { shop { name myshopifyDomain currencyCode ianaTimezone taxesIncluded plan { displayName } } }`;
export const PUBLICATIONS = `query Publications { publications(first: 20) { nodes { id name app { title } } } }`;
export const HANDLES = `query Handles($after: String, $pub: ID!) { products(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle publishedOnPublication(publicationId: $pub) } } }`;
export const COLLECTION = `query Collection($handle: String!) { collectionByIdentifier(identifier: { handle: $handle }) { id handle } }`;
export const COLLECTION_CREATE = `mutation CollectionCreate($collection: CollectionCreateInput!) { collectionCreate(collection: $collection) { collection { id handle } userErrors { field message } } }`;
export const STAGED_UPLOADS = `mutation Staged($input: [StagedUploadInput!]!) { stagedUploadsCreate(input: $input) { stagedTargets { url resourceUrl parameters { name value } } userErrors { field message } } }`;
export const PRODUCT_SET = `mutation ProductSet($input: ProductSetInput!, $identifier: ProductSetIdentifiers) { productSet(input: $input, identifier: $identifier, synchronous: true) { product { id handle } userErrors { field message code } } }`;
export const PUBLISH = `mutation Publish($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`;
export const REORDER = `mutation Reorder($id: ID!, $moves: [MoveInput!]!) { collectionReorderProducts(id: $id, moves: $moves) { job { id } userErrors { field message } } }`;
export const PRODUCT_IDS = `query ProductIds($handle: String!) { productByIdentifier(identifier: { handle: $handle }) { id tags variants(first: 100) { nodes { id } } } }`;
export const VARIANT_PRICES = `mutation VariantPrices($productId: ID!, $variants: [ProductVariantsBulkInput!]!) { productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } } }`;
export const TAGS_REMOVE = `mutation TagsRemove($id: ID!, $tags: [String!]!) { tagsRemove(id: $id, tags: $tags) { userErrors { field message } } }`;
