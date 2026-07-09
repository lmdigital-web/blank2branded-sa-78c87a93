import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link, useCurrentPath } from "@/lib/static-router";
import { buildJsonLd, type BofuTemplate } from "@/lib/bofu-templates";
import { Button } from "@/components/ui/button";

type BofuPage = {
  id: string;
  slug: string;
  template: BofuTemplate;
  keyword: string;
  title: string;
  meta_description: string | null;
  h1: string | null;
  intro: string | null;
  body_html: string | null;
  video_embed_html: string | null;
  video_url: string | null;
  faq_json: { q: string; a: string }[] | null;
  comparison_json: unknown;
  city: string | null;
  status: string;
};

const SITE_URL = "https://blank2branded.co.za";

function parsePath(path: string): { template: BofuTemplate; slug: string; city: string | null } | null {
  const clean = path.replace(/\/$/, "");
  let m = clean.match(/^\/vs\/([^/]+)$/);
  if (m) return { template: "versus", slug: m[1], city: null };
  m = clean.match(/^\/alternatives\/([^/]+)$/);
  if (m) return { template: "alternatives", slug: m[1], city: null };
  m = clean.match(/^\/best\/([^/]+)$/);
  if (m) return { template: "best", slug: m[1], city: null };
  m = clean.match(/^\/local\/([^/]+)\/([^/]+)$/);
  if (m) return { template: "local", slug: m[2], city: m[1] };
  return null;
}

export function BofuPagePublic() {
  const path = useCurrentPath();
  const parsed = parsePath(path);
  const [page, setPage] = useState<BofuPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parsed) { setLoading(false); return; }
    setLoading(true);
    const cityCond = parsed.city ? parsed.city.replace(/-/g, " ") : null;
    let q = supabase.from("bofu_pages").select("*").eq("template", parsed.template).eq("slug", parsed.slug).eq("status", "published");
    if (cityCond) q = q.ilike("city", cityCond); else q = q.is("city", null);
    q.maybeSingle().then(({ data }) => {
      setPage(data as BofuPage | null);
      setLoading(false);
      if (data) {
        document.title = (data as BofuPage).title;
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute("content", (data as BofuPage).meta_description || "");
        // JSON-LD
        document.querySelectorAll('script[data-bofu-ld]').forEach((s) => s.remove());
        const scripts = buildJsonLd(data as BofuPage, SITE_URL);
        for (const s of scripts) {
          const el = document.createElement("script");
          el.type = "application/ld+json";
          el.setAttribute("data-bofu-ld", "");
          el.text = JSON.stringify(s);
          document.head.appendChild(el);
        }
      }
    });
  }, [path]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading…</div>;

  if (!page) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Page not found</h1>
            <p className="mt-2 text-muted-foreground">This comparison page doesn't exist yet.</p>
            <Link to="/" className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const faq = Array.isArray(page.faq_json) ? page.faq_json : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-background">
        <article className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">{page.h1 || page.title}</h1>
          {page.intro && <p className="mt-4 text-lg text-muted-foreground">{page.intro}</p>}

          {page.video_embed_html && (
            <div
              className="mt-8"
              dangerouslySetInnerHTML={{ __html: page.video_embed_html }}
            />
          )}

          {page.body_html && (
            <div
              className="prose prose-neutral mt-10 max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.body_html }}
            />
          )}

          {faq.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold">Frequently asked questions</h2>
              <div className="mt-6 divide-y divide-border rounded-lg border border-border">
                {faq.map((f, i) => (
                  <details key={i} className="group p-4">
                    <summary className="cursor-pointer font-semibold">{f.q}</summary>
                    <p className="mt-2 text-muted-foreground">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 rounded-lg border border-border bg-muted/40 p-6 text-center">
            <h3 className="text-xl font-semibold">Ready to order?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Shop DTF prints and blank apparel with nationwide courier across South Africa.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/shop"><Button>Shop now</Button></Link>
              <Link to="/contact"><Button variant="outline">Get a quote</Button></Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
