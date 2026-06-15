import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useCurrentPath } from "@/lib/static-router";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/sonner";
import { useCartSync } from "@/hooks/useCartSync";
import { Home } from "@/routes/index";
import { AboutPage } from "@/routes/about";
import { BlanksPage } from "@/routes/blanks";
import { ContactPage } from "@/routes/contact";
import { DtfPage } from "@/routes/dtf";
import { ShopPage } from "@/routes/shop";
import { ProductPage } from "@/routes/products.$handle";

const queryClient = new QueryClient();

const SITE_URL = "https://blank2branded.co.za";

const pageMeta: Record<string, { title: string; description: string; keywords: string }> = {
  "/": {
    title: "DTF Prints & Blank T-Shirts South Africa | Blank2Branded",
    description:
      "DTF transfers and blank apparel supplier in South Africa. A6 to 10m DTF prints, blank tees, golf shirts & hoodies. Nationwide shipping from Mbombela.",
    keywords:
      "DTF printing South Africa, DTF transfers, blank t-shirts South Africa, blank apparel, gang sheet printing, custom t-shirt printing, Mbombela DTF, Mpumalanga printing",
  },
  "/about": {
    title: "About Blank2Branded | DTF & Blank Apparel Supplier South Africa",
    description:
      "Mbombela-based supplier of DTF transfers and blank apparel serving brands, businesses and individuals across South Africa. Fast turnaround, nationwide shipping.",
    keywords:
      "about Blank2Branded, DTF supplier South Africa, blank apparel supplier, Mbombela printing, Mpumalanga DTF",
  },
  "/blanks": {
    title: "Blank Apparel South Africa — Tees, Golf Shirts & Hoodies | Blank2Branded",
    description:
      "Premium blank apparel in South Africa — t-shirts, golf shirts and hoodies ready for DTF, screen print or embroidery. Wholesale prices, nationwide shipping.",
    keywords:
      "blank t-shirts South Africa, blank golf shirts, blank hoodies, wholesale blank apparel, blanks for DTF, blanks for embroidery, screen printing blanks",
  },
  "/contact": {
    title: "Contact Blank2Branded — Get a DTF & Apparel Quote | South Africa",
    description:
      "Contact Blank2Branded in Mbombela for DTF prints and blank apparel quotes. WhatsApp, email or call — nationwide shipping across South Africa.",
    keywords:
      "contact Blank2Branded, DTF quote South Africa, blank apparel quote, Mbombela DTF printing contact",
  },
  "/dtf": {
    title: "DTF Prints South Africa — A6 to 10m Gang Sheets | Blank2Branded",
    description:
      "Full-colour DTF transfers in South Africa, A6 to 10 metres. Build your own gang sheet, vivid prints on cotton, poly and blends. Nationwide shipping from Mbombela.",
    keywords:
      "DTF prints South Africa, DTF transfers, gang sheet DTF, A4 DTF print, A3 DTF print, 10m DTF roll, custom DTF transfers, DTF printing Mbombela",
  },
  "/shop": {
    title: "Shop DTF Prints & Blank Apparel Online | Blank2Branded South Africa",
    description:
      "Shop blank apparel, DTF transfers and branded gear from Blank2Branded. Wholesale pricing, fast dispatch and nationwide shipping across South Africa.",
    keywords:
      "shop DTF prints, buy blank t-shirts South Africa, online apparel shop, DTF transfers online, wholesale blanks",
  },
};

function ensureLink(rel: string): HTMLLinkElement {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  return el;
}

function ensureMeta(attr: "name" | "property", key: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  return el;
}

function applySeo(title: string, description: string, keywords: string, path: string) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  document.title = title;
  ensureMeta("name", "description").content = description;
  ensureMeta("name", "keywords").content = keywords;
  ensureLink("canonical").href = url;
  ensureMeta("property", "og:title").content = title;
  ensureMeta("property", "og:description").content = description;
  ensureMeta("property", "og:url").content = url;
  ensureMeta("name", "twitter:title").content = title;
  ensureMeta("name", "twitter:description").content = description;
}

function AppContent() {
  useCartSync();
  const path = useCurrentPath();
  const cleanPath = path.replace(/\/$/, "") || "/";
  const productMatch = cleanPath.match(/^\/products\/([^/]+)$/);
  const meta = pageMeta[cleanPath];

  useEffect(() => {
    if (productMatch) {
      const handle = productMatch[1];
      const pretty = handle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const title = `${pretty} | Blank2Branded South Africa`;
      const description = `Buy ${pretty} from Blank2Branded — DTF prints and blank apparel with nationwide shipping across South Africa.`;
      const keywords = `${pretty}, ${pretty} South Africa, buy ${pretty} online, Blank2Branded`;
      applySeo(title, description, keywords, cleanPath);
    } else if (meta) {
      applySeo(meta.title, meta.description, meta.keywords, cleanPath);
    } else {
      applySeo(pageMeta["/"].title, pageMeta["/"].description, pageMeta["/"].keywords, "/");
    }
  }, [cleanPath, meta, productMatch]);

  let page = <NotFoundPage />;
  if (cleanPath === "/") page = <Home />;
  else if (cleanPath === "/about") page = <AboutPage />;
  else if (cleanPath === "/blanks") page = <BlanksPage />;
  else if (cleanPath === "/contact") page = <ContactPage />;
  else if (cleanPath === "/dtf") page = <DtfPage />;
  else if (cleanPath === "/shop") page = <ShopPage />;
  else if (/^\/products\/[^/]+$/.test(cleanPath)) page = <ProductPage />;

  return (
    <>
      {page}
      <WhatsAppButton />
      <Toaster />
    </>
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}