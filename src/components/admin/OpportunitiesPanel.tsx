import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, TrendingUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { navigate } from "@/lib/static-router";
import { slugify } from "@/lib/slugify";

type Item = { keyword: string; clicks: number; impressions: number; ctr: number; position: number };
type Cluster = { topic: string; total_impressions: number; items: Item[] };

function outlineFor(keyword: string): string {
  const k = keyword.trim();
  const t = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  return `<h2>${t(`Introduction to ${k}`)}</h2>
<p>Write a 2-3 sentence intro that names <strong>${k}</strong> in the first sentence and explains who this guide is for.</p>
<h2>${t(`What is ${k}?`)}</h2>
<p>Define the term, who searches for it, and the South African context.</p>
<h3>Key benefits</h3>
<ul><li>Benefit one</li><li>Benefit two</li><li>Benefit three</li></ul>
<h2>${t(`How to choose ${k}`)}</h2>
<p>Buyer criteria, pricing tiers, common mistakes.</p>
<h3>Pricing in ZAR</h3>
<p>Include a price range.</p>
<h2>${t(`${k} from Blank2Branded`)}</h2>
<p>Internal link to relevant <a href="/shop">shop</a> or <a href="/blanks">blanks</a> page.</p>
<h2>FAQ</h2>
<h3>Question one?</h3><p>Answer.</p>
<h3>Question two?</h3><p>Answer.</p>
<h2>Conclusion</h2>
<p>Recap and CTA — link to <a href="/contact">contact</a> or quote request.</p>`;
}

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
    const { data: u } = await supabase.auth.getUser();
    const title = keyword.replace(/\b\w/g, (c) => c.toUpperCase());
    const payload = {
      title,
      slug: slugify(title),
      excerpt: `A practical guide to ${keyword} for South African buyers.`,
      content: outlineFor(keyword),
      status: "draft",
      meta_title: `${title} | Blank2Branded SA`,
      meta_description: `Everything you need to know about ${keyword} in South Africa — pricing, options, and how to order.`,
      keywords: keyword,
      author_id: u.user?.id,
    };
    const { data, error } = await supabase.from("posts").insert(payload).select("id").single();
    setCreating(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Draft created — opening editor");
    navigate(`/admin/posts/${data.id}`);
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
                    disabled={creating === it.keyword}
                  >
                    {creating === it.keyword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Generate Draft"}
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
