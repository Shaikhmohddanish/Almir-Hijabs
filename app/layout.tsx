import type { Metadata } from "next";
import { Hanken_Grotesk, Libre_Caslon_Display } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import CartDrawer from "./components/CartDrawer";
import { CartProvider } from "./components/CartProvider";
import RevealObserver from "./components/RevealObserver";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";

const caslon = Libre_Caslon_Display({
  variable: "--font-caslon",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Hanken Grotesk is also shadcn's sans face: --font-sans points at it in globals.css.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  // The picture a link shows in WhatsApp and elsewhere; one of the looks until the client sends a logo or a brand image.
  openGraph: { siteName: site.name, type: "website", locale: "en_IN", images: [{ url: "/looks/gold-flower.webp", width: 900, height: 900, alt: "A black niqab with a gold flower on the band, on a display head" }] },
  twitter: { card: "summary" },
  title: { default: "Almir Hijabs | Niqabs, hijabs and undercaps", template: "%s | Almir Hijabs" },
  description:
    "Black niqabs with embroidery and fringe, satin hijabs and jersey undercaps in many colours, from Almir Hijabs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(caslon.variable, hanken.variable, "font-sans")} suppressHydrationWarning>
      <head>
        {/* Reveals hide content only once this runs, so the page reads fully without script. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CartDrawer />
          <RevealObserver />
        </CartProvider>
      </body>
    </html>
  );
}
