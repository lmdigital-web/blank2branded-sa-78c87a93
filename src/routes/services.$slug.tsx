import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServicePageTemplate } from "@/components/ServicePageTemplate";
import { supabase } from "@/integrations/supabase/client";
import { Link, useCurrentPath } from "@/lib/static-router";
import { setNoindex } from "@/lib/robots-meta";
import { setRouteSeo } from "@/lib/seo-head";
import {
  buildServiceJsonLd,
  parseServiceSlug,
  SERVICE_PAGE_SELECT,
  toServicePage,
  type ServicePage,
} from "@/lib/service-pages";

const SITE_URL = "https://blank2branded.co.za";

export function ServicePageRoute() {
  const path = useCurrentPath();
  const slug = parseServiceSlug(path);
  const [page, setPage] = useState<ServicePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);

    supabase
      .from("service_pages")
      .select(SERVICE_PAGE_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        const row = data as Record<string, unknown> | null;
        setPage(row ? toServicePage(row) : null);
        setLoading(false);
        // The SPA fallback returns 200 for unknown slugs, so noindex them
        // rather than letting Google report a Soft 404.
        setNoindex(!row);
        if (!row) return;

        const page = toServicePage(row);
        setRouteSeo({
          title: page.title,
          description: page.meta_description || "",
          keywords: page.keyword,
          url: `${SITE_URL}/services/${page.slug}/`,
        });

        document
          .querySelectorAll('script[data-service-ld]')
          .forEach((s) => s.remove());
        for (const s of buildServiceJsonLd(page, SITE_URL)) {
          const el = document.createElement("script");
          el.type = "application/ld+json";
          el.setAttribute("data-service-ld", "");
          el.text = JSON.stringify(s);
          document.head.appendChild(el);
        }
      });
  }, [slug]);

  if (loading)
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;

  if (!page) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Service not found</h1>
            <p className="mt-2 text-muted-foreground">
              This service page doesn't exist yet.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Go home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <ServicePageTemplate page={page} />;
}