import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, RotateCcw, Search } from "lucide-react";

type PostRow = {
  kind: "post";
  id: string;
  slug: string;
  path: string;
  displayTitle: string;
  meta_title: string;
  meta_description: string;
  cover_image_url: string;
  canonical: string;
};

type RouteRow = {
  kind: "route";
  id: string;
  slug: string;
  path: string;
  displayTitle: string;
  meta_title: string;
  meta_description: string;
  cover_image_url: string;
  canonical: string;
};

type Row = PostRow | RouteRow;

const STATIC_ROUTES = [
  { slug: "/", label: "Home" },
  { slug: "/shop", label: "Shop" },
  { slug: "/dtf", label: "DTF Transfers" },
  { slug: "/blanks", label: "Blank Apparel" },
  { slug: "/blog", label: "Blog Index" },
  { slug: "/about", label: "About" },
  { slug: "/contact", label: "Contact" },
  { slug: "/display", label: "Display" },
  { slug: "/sublimation", label: "Sublimation" },
  { slug: "/catalogues", label: "Catalogues" },
  { slug: "/privacy", label: "Privacy" },
  { slug: "/terms", label: "Terms" },
];

const DEFAULTS: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Blank2Branded — DTF Transfers & Blank Apparel South Africa",
    description: "South Africa's go-to for premium DTF transfers, blank apparel, sublimation and display printing. Fast turnaround, nationwide delivery, unbeatable quality.",
  },
  "/shop": {
    title: "Shop DTF Transfers, Blanks & Print Supplies | Blank2Branded",
    description: "Browse our full range of DTF transfers, blank t-shirts, hoodies, caps and print-ready apparel. Wholesale pricing, fast delivery across South Africa.",
  },
  "/dtf": {
    title: "DTF Transfers South Africa — Custom Prints from R25 | Blank2Branded",
    description: "Order custom Direct-to-Film (DTF) transfers online. Vibrant colours, soft feel, washes 50+ times. Upload artwork, get a quote and delivery in 2-3 days.",
  },
  "/blanks": {
    title: "Blank Apparel Wholesale — T-Shirts, Hoodies, Caps | Blank2Branded",
    description: "Premium blank t-shirts, hoodies, caps and workwear ready for print. Wholesale pricing on top SA brands. Order online with nationwide delivery.",
  },
  "/blog": {
    title: "Blog — DTF Printing Tips, Guides & News | Blank2Branded",
    description: "DTF printing tips, blank apparel buying guides, application tutorials and news from South Africa's leading print-and-press supplier.",
  },
  "/about": {
    title: "About Blank2Branded — SA's Trusted DTF & Blanks Supplier",
    description: "Family-run South African print business supplying DTF transfers, blank apparel and sublimation gear to brands, resellers and print shops nationwide.",
  },
  "/contact": {
    title: "Contact Blank2Branded — DTF & Blank Apparel Quotes SA",
    description: "Get in touch for DTF transfer quotes, wholesale blanks pricing or press advice. WhatsApp, email or phone — we reply within one business day.",
  },
  "/display": {
    title: "Display Printing — Banners, Pull-Ups & Signage | Blank2Branded",
    description: "Large-format display prints: pull-up banners, roller banners, PVC signs and event signage. Print-ready in 48 hours, delivered across South Africa.",
  },
  "/sublimation": {
    title: "Sublimation Printing & Blanks South Africa | Blank2Branded",
    description: "Sublimation blanks, transfer paper and ready-to-press prints for mugs, apparel and hardgoods. Wholesale pricing and nationwide delivery from Blank2Branded.",
  },
  "/catalogues": {
    title: "Product Catalogues — DTF & Blank Apparel PDFs | Blank2Branded",
    description: "Download the latest Blank2Branded catalogues for DTF transfers, blank apparel, sublimation and display printing. Full range, sizes and wholesale pricing.",
  },
  "/privacy": {
    title: "Privacy Policy | Blank2Branded",
    description: "How Blank2Branded collects, uses and protects your personal information across our website, orders and customer communications in South Africa.",
  },
  "/terms": {
    title: "Terms & Conditions | Blank2Branded",
    description: "Terms of sale, delivery, returns and website use for Blank2Branded — South Africa's trusted DTF transfers and blank apparel supplier.",
  },
};

const BASE = "https://blank2branded.co.za";

export function MetaEditorPanel({ initialSearch = "" }: { initialSearch?: string } = {}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [saving, setSaving] = useState<string | null>(null);
  const [autofilling, setAutofilling] = useState(false);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [postsRes, routeRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id,slug,title,meta_title,meta_description,cover_image_url")
        .order("updated_at", { ascending: false }),
      supabase.from("route_meta").select("*"),
    ]);

    const routeMap = new Map<string, { title: string | null; description: string | null; canonical: string | null; og_image: string | null }>();
    for (const r of routeRes.data ?? []) {
      routeMap.set(r.slug, r);
    }

    const routeRows: Row[] = STATIC_ROUTES.map((r) => {
      const existing = routeMap.get(r.slug);
      return {
        kind: "route" as const,
        id: `route:${r.slug}`,
        slug: r.slug,
        path: r.slug,
        displayTitle: r.label,
        meta_title: existing?.title ?? "",
        meta_description: existing?.description ?? "",
        cover_image_url: existing?.og_image ?? "",
        canonical: existing?.canonical ?? `${BASE}${r.slug === "/" ? "" : r.slug}`,
      };
    });

    const postRows: Row[] = (postsRes.data ?? []).map((p) => ({
      kind: "post" as const,
      id: `post:${p.id}`,
      slug: p.slug,
      path: `/blog/${p.slug}`,
      displayTitle: p.title,
      meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "",
      cover_image_url: p.cover_image_url ?? "",
      canonical: `${BASE}/blog/${p.slug}`,
    }));

    setRows([...routeRows, ...postRows]);
    setDirty({});
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.displayTitle.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q) ||
        r.meta_title.toLowerCase().includes(q),
    );
  }, [rows, search]);

  function update(id: string, field: keyof Omit<Row, "id" | "kind" | "slug" | "path" | "displayTitle">, value: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    setDirty((d) => ({ ...d, [id]: true }));
  }

  async function save(row: Row) {
    setSaving(row.id);
    try {
      if (row.kind === "post") {
        const postId = row.id.replace("post:", "");
        const { error } = await supabase
          .from("posts")
          .update({
            meta_title: row.meta_title || null,
            meta_description: row.meta_description || null,
            cover_image_url: row.cover_image_url || null,
          })
          .eq("id", postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("route_meta")
          .upsert(
            {
              slug: row.slug,
              title: row.meta_title || null,
              description: row.meta_description || null,
              canonical: row.canonical || null,
              og_image: row.cover_image_url || null,
            },
            { onConflict: "slug" },
          );
        if (error) throw error;
      }
      toast.success(`Saved ${row.path}`);
      setDirty((d) => {
        const { [row.id]: _, ...rest } = d;
        return rest;
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reload
        </Button>
        <Button onClick={() => void autoFillMissing()} disabled={autofilling}>
          <Sparkles className="mr-2 h-4 w-4" />
          {autofilling ? "Filling…" : "Auto-fill missing meta"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-1">
        <p className="p-3 text-xs text-muted-foreground">
          Edit meta titles (30–60 chars), descriptions (120–160 chars), canonical URLs, and OG images. Static routes save to <code className="rounded bg-muted px-1">route_meta</code> and take effect on the next site build. Blog posts save immediately. Click <strong>Auto-fill missing meta</strong> to populate SEO-optimised titles &amp; descriptions for any static page still missing them.
        </p>
      </div>

      {loading ? (
        <p className="p-6 text-center text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const titleLen = row.meta_title.length;
            const descLen = row.meta_description.length;
            const titleColor = titleLen === 0 ? "text-muted-foreground" : titleLen > 60 ? "text-destructive" : titleLen < 30 ? "text-amber-600" : "text-green-600";
            const descColor = descLen === 0 ? "text-muted-foreground" : descLen > 160 ? "text-destructive" : descLen < 120 ? "text-amber-600" : "text-green-600";
            const isDirty = dirty[row.id];
            return (
              <div key={row.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{row.displayTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className={`mr-2 rounded px-1.5 py-0.5 ${row.kind === "post" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                        {row.kind === "post" ? "Blog Post" : "Static Route"}
                      </span>
                      {row.path}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => save(row)} disabled={!isDirty || saving === row.id}>
                    <Save className="mr-1 h-4 w-4" />
                    {saving === row.id ? "Saving…" : isDirty ? "Save" : "Saved"}
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium">
                      Meta title <span className={titleColor}>({titleLen}/60)</span>
                    </label>
                    <Input
                      value={row.meta_title}
                      onChange={(e) => update(row.id, "meta_title", e.target.value)}
                      placeholder="Page title for search results"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Canonical URL</label>
                    <Input
                      value={row.canonical}
                      onChange={(e) => update(row.id, "canonical", e.target.value)}
                      disabled={row.kind === "post"}
                      placeholder={`${BASE}${row.path}`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">
                      Meta description <span className={descColor}>({descLen}/160)</span>
                    </label>
                    <Textarea
                      value={row.meta_description}
                      onChange={(e) => update(row.id, "meta_description", e.target.value)}
                      rows={2}
                      placeholder="1-sentence summary shown under the title in search results"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium">Open Graph image URL</label>
                    <Input
                      value={row.cover_image_url}
                      onChange={(e) => update(row.id, "cover_image_url", e.target.value)}
                      placeholder="https://…/preview.jpg (1200x630 recommended)"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
