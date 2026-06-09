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

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": {
    title: "DTF Prints + Blank T-Shirts South Africa | Blank2Branded",
    description:
      "Supplier of DTF transfers and blank apparel for brands, businesses and individuals. Nationwide shipping across South Africa.",
  },
  "/about": {
    title: "About Blank2Branded | DTF + Blank Apparel Supplier",
    description: "Mbombela-based supplier of DTF transfers and blank apparel serving South Africa.",
  },
  "/blanks": {
    title: "Blank Apparel — Tees, Golf Shirts & Hoodies | Blank2Branded",
    description: "Premium blank apparel ready for DTF, screen print or embroidery.",
  },
  "/contact": {
    title: "Contact — Get a Quote | Blank2Branded",
    description: "Request a quote for DTF prints and blank apparel.",
  },
  "/dtf": {
    title: "DTF Prints — A6 to 10m Roll Prints | Blank2Branded",
    description: "Full-colour DTF transfers from A6 up to 10 metres long.",
  },
  "/shop": {
    title: "Shop — Blank2Branded",
    description: "Shop blank apparel, DTF transfers and branded gear from Blank2Branded.",
  },
};

function AppContent() {
  useCartSync();
  const path = useCurrentPath();
  const cleanPath = path.replace(/\/$/, "") || "/";
  const meta = pageMeta[cleanPath] ?? pageMeta["/"];

  useEffect(() => {
    document.title = meta.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = meta.description;
  }, [meta]);

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