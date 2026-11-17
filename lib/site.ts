// The shop's own facts, in one place. An empty value means the client hasn't sent it yet, and the pages then keep their "to follow" lines.
export const site = {
  name: "Almir Hijabs",
  // Where the site is served from; the sitemap and the product data use it.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: "",
  // Digits only, with the country code, as wa.me wants them (91XXXXXXXXXX).
  whatsapp: "",
  email: "",
  // The full address of the shop's Instagram page.
  instagram: "",
};
