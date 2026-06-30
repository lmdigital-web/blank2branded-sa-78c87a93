import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { Link, useCurrentPath } from "@/lib/static-router";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/sonner";
import { useCartSync } from "@/hooks/useCartSync";
import { Home } from "@/routes/index";
const AboutPage = lazy(() => import("@/routes/about").then((m) => ({ default: m.AboutPage })));
const BlanksPage = lazy(() => import("@/routes/blanks").then((m) => ({ default: m.BlanksPage })));
const ContactPage = lazy(() => import("@/routes/contact").then((m) => ({ default: m.ContactPage })));
const DtfPage = lazy(() => import("@/routes/dtf").then((m) => ({ default: m.DtfPage })));
const ShopPage = lazy(() => import("@/routes/shop").then((m) => ({ default: m.ShopPage })));
const ProductPage = lazy(() => import("@/routes/products.$handle").then((m) => ({ default: m.ProductPage })));
const BlogIndexPage = lazy(() => import("@/routes/blog").then((m) => ({ default: m.BlogIndexPage })));
const BlogPostPage = lazy(() => import("@/routes/blog.$slug").then((m) => ({ default: m.BlogPostPage })));
const LoginPage = lazy(() => import("@/routes/login").then((m) => ({ default: m.LoginPage })));
const AdminPage = lazy(() => import("@/routes/admin").then((m) => ({ default: m.AdminPage })));
const PostEditorPage = lazy(() => import("@/routes/admin.post-editor").then((m) => ({ default: m.PostEditorPage })));
const PostPreviewPage = lazy(() => import("@/routes/admin.preview").then((m) => ({ default: m.PostPreviewPage })));
const PrivacyPage = lazy(() => import("@/routes/privacy").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/routes/terms").then((m) => ({ default: m.TermsPage })));
const DisplayPage = lazy(() => import("@/routes/display").then((m) => ({ default: m.DisplayPage })));
const SublimationPage = lazy(() => import("@/routes/sublimation").then((m) => ({ default: m.SublimationPage })));
const CataloguesPage = lazy(() => import("@/routes/catalogues").then((m) => ({ default: m.CataloguesPage })));
const BlogRedirectPage = lazy(() => import("@/routes/redirect").then((m) => ({ default: m.BlogRedirectPage })));

const queryClient = new QueryClient();


const SITE_URL = "https://blank2branded.co.za";

// Keyword map — one focus keyword + supporting/long-tail terms per page,
// targeted at South African search intent for DTF prints and blank apparel.
const pageMeta: Record<
  string,
  { title: string; description: string; keywords: string; focusKeyword: string }
> = {
  "/": {
    focusKeyword: "DTF printing South Africa",
    title: "DTF Printing South Africa | Blank T-Shirts & Transfers | Blank2Branded",
    description:
      "Buy DTF transfers and blank t-shirts in South Africa. Gang sheets from A6 to 10m, blank tees, golf shirts & hoodies. Courier nationwide from Mbombela.",
    keywords:
      "DTF printing South Africa, DTF transfers South Africa, DTF prints near me, blank t-shirts South Africa, blank apparel suppliers South Africa, gang sheet printing, custom t-shirt printing South Africa, DTF Mbombela, DTF Mpumalanga, DTF Johannesburg, DTF Pretoria, DTF Cape Town, DTF Durban",
  },
  "/about": {
    focusKeyword: "DTF supplier South Africa",
    title: "About Blank2Branded | DTF & Blank Apparel Supplier in South Africa",
    description:
      "Blank2Branded is a Mbombela-based DTF print and blank apparel supplier serving resellers, brands and print shops across South Africa. Fast turnaround, courier nationwide.",
    keywords:
      "DTF supplier South Africa, blank apparel supplier South Africa, wholesale t-shirt supplier, Mbombela print shop, Mpumalanga DTF supplier, about Blank2Branded",
  },
  "/blanks": {
    focusKeyword: "blank t-shirts South Africa",
    title: "Blank T-Shirts South Africa | Wholesale Tees, Golf Shirts & Hoodies",
    description:
      "Wholesale blank t-shirts, golf shirts and hoodies in South Africa. 100% cotton and poly-cotton blanks ready for DTF, screen print or embroidery. Courier nationwide.",
    keywords:
      "blank t-shirts South Africa, wholesale blank t-shirts, blank golf shirts South Africa, blank hoodies South Africa, plain t-shirts wholesale, 100 cotton blanks, blanks for DTF printing, blanks for embroidery, screen printing blanks South Africa, bulk t-shirts South Africa",
  },
  "/contact": {
    focusKeyword: "DTF printing quote South Africa",
    title: "Contact Blank2Branded | DTF & Blank Apparel Quotes South Africa",
    description:
      "Get a DTF print or blank apparel quote from Blank2Branded. WhatsApp, email or call our Mbombela team. Fast quotes and nationwide courier across South Africa.",
    keywords:
      "DTF printing quote South Africa, blank t-shirt quote, contact DTF supplier, WhatsApp DTF printing, Mbombela DTF contact, custom t-shirt printing quote",
  },
  "/dtf": {
    focusKeyword: "DTF transfers South Africa",
    title: "DTF Transfers South Africa | A6 to 10m Gang Sheets | Blank2Branded",
    description:
      "Order full-colour DTF transfers in South Africa — A6, A5, A4, A3 and 10m gang sheets. Vivid prints on cotton, polyester and blends. Courier nationwide from Mbombela.",
    keywords:
      "DTF transfers South Africa, DTF prints South Africa, gang sheet DTF South Africa, A3 DTF print, A4 DTF print, A5 DTF transfers, 10m DTF roll, custom DTF transfers, DTF heat transfers, DTF printing for resellers, DTF Mbombela, DTF Johannesburg, DTF Cape Town",
  },
  "/shop": {
    focusKeyword: "buy DTF prints and blank t-shirts online South Africa",
    title: "Shop DTF Transfers & Blank T-Shirts Online | Blank2Branded South Africa",
    description:
      "Shop DTF transfers, blank t-shirts, golf shirts and hoodies online. Wholesale pricing, secure checkout and nationwide courier across South Africa.",
    keywords:
      "buy DTF prints online South Africa, buy blank t-shirts online South Africa, online DTF shop, wholesale blanks online, order DTF transfers South Africa, blank apparel online store",
  },
  "/blog": {
    focusKeyword: "DTF printing blog South Africa",
    title: "Blog | DTF Printing & Blank Apparel Tips South Africa | Blank2Branded",
    description:
      "Guides, tips and news on DTF printing, blank apparel and custom t-shirt printing in South Africa. From the Blank2Branded team in Mbombela.",
    keywords:
      "DTF printing blog, DTF tips South Africa, blank apparel guides, custom t-shirt printing tips, Blank2Branded blog",
  },
  "/privacy": {
    focusKeyword: "privacy policy",
    title: "Privacy Policy | Blank2Branded South Africa",
    description:
      "How Blank2Branded collects, uses and protects your personal information under POPIA. South African DTF and blank apparel supplier based in Mbombela.",
    keywords: "privacy policy, POPIA, Blank2Branded privacy, data protection South Africa",
  },
  "/terms": {
    focusKeyword: "terms and conditions",
    title: "Terms & Conditions | Blank2Branded South Africa",
    description:
      "Terms and conditions for buying DTF transfers and blank apparel from Blank2Branded — orders, delivery, returns and refunds for South African customers.",
    keywords: "terms and conditions, returns policy, refund policy, Blank2Branded terms",
  },
  "/display": {
    focusKeyword: "branded display products South Africa",
    title: "Branded Display & Signage South Africa | Gazebos, Banners, Flags | Blank2Branded",
    description:
      "Branded gazebos, banner walls, pull-up banners, flags, table cloths and more. Custom display solutions for events and expos across South Africa. Request a quote.",
    keywords:
      "branded gazebos South Africa, pull up banners South Africa, harp banners, banner walls, branded table cloths, fence wrap, corporate flags, A-frame banners, pop up banners, branded umbrellas, pennant flags, display products South Africa",
  },
  "/sublimation": {
    focusKeyword: "sublimation printing South Africa",
    title: "Sublimation Printing South Africa | Custom Golf Shirts, Jerseys, Tees | Blank2Branded",
    description:
      "All-over sublimation printed apparel for Mens, Ladies and Kids — custom golf shirts, rugby jerseys, t-shirts, vests, skirts and sets. Edge-to-edge full-colour print. Request a quote.",
    keywords:
      "sublimation printing South Africa, custom golf shirts, custom rugby jerseys, sublimated t-shirts, all over print apparel, custom team kits South Africa, sublimation Mbombela, kids sports kits, ladies golf shirts custom",
  },
  "/catalogues": {
    focusKeyword: "branded gifts catalogue South Africa",
    title: "Catalogues | Branded Gifts, Bags & Corporate Gifting South Africa | Blank2Branded",
    description:
      "Browse our digital catalogues for branded gifts, bags, drinkware and corporate gifting in South Africa. Request a quote with print and embroidery options.",
    keywords:
      "branded gifts catalogue South Africa, corporate gifts catalogue, branded bags catalogue, conference bags South Africa, promotional products catalogue, Blank2Branded catalogues",
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
  else if (cleanPath === "/blog") page = <BlogIndexPage />;
  else if (/^\/blog\/[^/]+$/.test(cleanPath)) page = <BlogPostPage />;
  else if (cleanPath === "/login") page = <LoginPage />;
  else if (cleanPath === "/admin") page = <AdminPage />;
  else if (cleanPath === "/admin/posts/new") page = <PostEditorPage />;
  else if (/^\/admin\/posts\/[^/]+$/.test(cleanPath)) page = <PostEditorPage />;
  else if (/^\/admin\/preview\/[^/]+$/.test(cleanPath)) page = <PostPreviewPage />;
  else if (cleanPath === "/privacy") page = <PrivacyPage />;
  else if (cleanPath === "/terms") page = <TermsPage />;
  else if (cleanPath === "/display") page = <DisplayPage />;
  else if (cleanPath === "/sublimation") page = <SublimationPage />;
  else if (cleanPath === "/catalogues") page = <CataloguesPage />;
  else if (/^\/products\/[^/]+$/.test(cleanPath)) page = <ProductPage />;

  return (
    <>
      <Suspense fallback={<div className="min-h-screen" />}>{page}</Suspense>
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