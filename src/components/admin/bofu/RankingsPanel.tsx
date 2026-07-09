import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bofuUrl, type BofuTemplate } from "@/lib/bofu-templates";

type Row = { keys?: string[]; clicks: number; impressions: number; position: number; ctr: number };
type Page = { id: string; slug: string; title: string; template: BofuTemplate; city: string | null };

export function RankingsPanel() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true); setError(null);
    try {
      const { data: p } = await supabase.from("bofu_pages").select("id,slug,title,template,city").eq("status", "published");
      setPages((p as Page[]) ?? []);
      const { data, error } = await supabase.functions.invoke("gsc-stats", { body: { days: 28, dimensions: ["page"], rowLimit: 500 } });
      if (error) throw error;
      setRows((data?.rows as Row[]) ?? []);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }

  const bofuUrls = new Set(pages.map((p) => bofuUrl(p.template, p.slug, p.city)));
  const filtered = rows.filter((r) => {
    const url = r.keys?.[0] ?? "";
    try {
      const path = new URL(url).pathname;
      return bofuUrls.has(path.endsWith("/") ? path : `${path}/`);
    } catch { return false; }
  }).sort((a, b) => b.impressions - a.impressions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">BOFU page rankings (last 28 days)</h3>
          <p className="text-sm text-muted-foreground">Google Search Console data filtered to your BOFU pages.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {loading && <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">Loading GSC data…</div>}

      {!loading && !error && (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2">Page</th><th className="px-4 py-2 text-right">Impressions</th><th className="px-4 py-2 text-right">Clicks</th><th className="px-4 py-2 text-right">Avg Position</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No GSC data for BOFU pages yet. Publish pages and give Google 1-2 weeks.</td></tr>}
              {filtered.map((r) => {
                const url = r.keys?.[0] ?? "";
                const p1 = r.position <= 10 ? "bg-green-100 text-green-800" : r.position <= 20 ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground";
                return (
                  <tr key={url} className="border-b border-border last:border-0">
                    <td className="px-4 py-2"><a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{new URL(url).pathname}</a></td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.impressions.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.clicks.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right"><span className={`rounded px-2 py-0.5 text-xs tabular-nums ${p1}`}>{r.position.toFixed(1)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
