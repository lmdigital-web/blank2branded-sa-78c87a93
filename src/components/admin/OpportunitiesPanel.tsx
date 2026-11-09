import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/static-router";
import { slugify } from "@/lib/slugify";

type Item = { keyword: string; clicks: number; impressions: number; ctr: number; position: number };
type Cluster = { topic: string; total_impressions: number; items: Item[] };

export function OpportunitiesPanel() {
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("gsc-opportunities", { body: {} });
    if (error) setError(error.message);
    else setClusters((data?.clusters as Cluster[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  async function generateDraft(keyword: string) {
    setCreating(keyword);
    try {
      // 1. Generate the article with AI (title, meta, content, FAQs, experience notes)
      const { data: draft, error: aiErr } = await supabase.functions.invoke("generate-blog-draft", {
        body: {
          topic: keyword,
          keyword,
          tone: "Friendly",
          wordCount: 1500,
          audience: "South African resellers, print shops and small business owners",
          intent: "Informational",
          includeFaq: true,
          includeInternalLinks: true,
        },
      });
      if (aiErr) throw new Error(aiErr.message);
      const d = draft as {
        title: string;
        meta_title: string;
        meta_description: string;
        slug: string;
        excerpt: string;
        content: string;
        experience_notes?: string;
        suggested_tags?: string[];
        featured_image_prompt?: string;
        featured_image_alt?: string;
        error?: string;
      };
      if (d?.error) throw new Error(d.error);
      if (!d?.content) throw new Error("AI returned an empty draft");

      // 2. Fetch the default author to avoid foreign key violation
      const { data: authors } = await supabase.from("authors").select("id").limit(1);
      const author_id = authors?.[0]?.id;

      // 3. Generate a featured image (best effort — don't fail the draft if it errors)
      let cover_image_url = "";
      const { data: img } = await supabase.functions.invoke("generate-blog-image", {
        body: { prompt: d.featured_image_prompt || `Professional South African business photo illustrating ${keyword}` },
      });
      if (img?.url) cover_image_url = img.url;

      // 4. Embed the image inside the article body AFTER the first paragraph
      // (so the first paragraph still leads with the focus keyword for SEO scoring)
      const alt = d.featured_image_alt || keyword;
      const imgHtml = cover_image_url
        ? `<p><img src="${cover_image_url}" alt="${alt.replace(/"/g, "&quot;")}" loading="lazy" /></p>`
        : "";
      const contentWithImage = imgHtml
        ? d.content.replace(/(<p[^>]*>[\s\S]*?<\/p>)/i, `$1${imgHtml}`)
        : d.content;

      // 5. Insert the full post
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        title: d.title || keyword,
        slug: d.slug || slugify(d.title || keyword),
        excerpt: d.excerpt || `A practical guide to ${keyword} for South African buyers.`,
        content: contentWithImage,
        status: "draft",
        meta_title: d.meta_title || d.title || keyword,
        meta_description: d.meta_description || "",
        keywords: keyword,
        cover_image_url,
        author_id,
        created_by: u.user?.id,
        ...(d.experience_notes ? { experience_notes: d.experience_notes } : {}),
      };
      const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
      if (error) throw error;
      toast.success(cover_image_url ? "AI draft + image created — opening editor" : "AI draft created — opening editor");
      navigate(`/admin/posts/${data.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate draft");
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> High-Priority Content Opportunities
          </h2>
          <p className="text-sm text-muted-foreground">
            Keywords ranking on page 2 of Google (positions 11-25) — the fastest path to page 1.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {loading && <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Scanning Google Search Console…</div>}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {!loading && !error && clusters.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No page-2 opportunities yet. Keep publishing — they'll appear once Google indexes more content.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {clusters.map((c) => (
          <div key={c.topic} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-base font-semibold capitalize flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {c.topic}
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {c.total_impressions.toLocaleString()} impressions
              </span>
            </div>
            <ul className="mt-2 divide-y divide-border">
              {c.items.slice(0, 8).map((it) => (
                <li key={it.keyword} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{it.keyword}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      pos {it.position.toFixed(1)} · {it.impressions} impr · {it.clicks} clicks
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => generateDraft(it.keyword)}
                    disabled={creating !== null}
                    title="Generates a full AI-written, SEO-optimised article (~30-60s)"
                  >
                    {creating === it.keyword ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="ml-1">Writing article…</span>
                      </>
                    ) : (
                      "Generate Draft"
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
