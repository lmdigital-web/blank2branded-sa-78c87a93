import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@/lib/static-router";
import { Button } from "@/components/ui/button";
import { TrendingDown, RefreshCw, ExternalLink, Loader2 } from "lucide-react";

type DecayRow = {
  url: string;
  current_clicks: number;
  previous_clicks: number;
  current_impressions: number;
  previous_impressions: number;
  click_delta_pct: number;
  impression_delta_pct: number;
  position_delta: number;
};

type PostLookup = { id: string; slug: string };

export function DecayPanel() {
  const [rows, setRows] = useState<DecayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postBySlug, setPostBySlug] = useState<Map<string, PostLookup>>(new Map());

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error }, postsRes] = await Promise.all([
        supabase.functions.invoke("gsc-decay", { body: {} }),
        supabase.from("posts").select("id,slug"),
      ]);
      if (error) throw error;
      setRows(((data as { rows?: DecayRow[] })?.rows ?? []).filter(
        (r) => r.click_delta_pct <= -20 || r.impression_delta_pct <= -20,
      ));
      const m = new Map<string, PostLookup>();
      for (const p of (postsRes.data as PostLookup[] | null) ?? []) m.set(p.slug, p);
      setPostBySlug(m);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load decay data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function slugFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const m = u.pathname.match(/^\/blog\/([^/]+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-amber-600" />
          <h2 className="text-sm font-semibold">Rankings at Risk (Content Decay)</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
      <div className="p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Pages whose clicks or impressions dropped &gt;20% over the last 30 days vs the prior 30 days. Top 50 URLs from Search Console.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && !loading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No rankings at risk right now. Nice work.</p>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">URL</th>
                  <th className="py-2 pr-3 text-right">Clicks Δ</th>
                  <th className="py-2 pr-3 text-right">Impr. Δ</th>
                  <th className="py-2 pr-3 text-right">Pos. Δ</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const slug = slugFromUrl(r.url);
                  const post = slug ? postBySlug.get(slug) : null;
                  return (
                    <tr key={r.url} className="border-t border-border">
                      <td className="py-2 pr-3 max-w-xs truncate">
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
                          {r.url.replace(/^https?:\/\/[^/]+/, "")}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${r.click_delta_pct < 0 ? "text-destructive" : ""}`}>
                        {r.click_delta_pct > 0 ? "+" : ""}{r.click_delta_pct.toFixed(0)}%
                        <div className="text-xs text-muted-foreground">{r.previous_clicks} → {r.current_clicks}</div>
                      </td>
                      <td className={`py-2 pr-3 text-right tabular-nums ${r.impression_delta_pct < 0 ? "text-destructive" : ""}`}>
                        {r.impression_delta_pct > 0 ? "+" : ""}{r.impression_delta_pct.toFixed(0)}%
                        <div className="text-xs text-muted-foreground">{r.previous_impressions} → {r.current_impressions}</div>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {r.position_delta > 0 ? "+" : ""}{r.position_delta.toFixed(1)}
                      </td>
                      <td className="py-2 text-right">
                        {post ? (
                          <Link to={`/admin/posts/${post.id}`}>
                            <Button size="sm" variant="outline">Optimize &amp; Update</Button>
                          </Link>
                        ) : (
                          <a href={r.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost">Open</Button>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
