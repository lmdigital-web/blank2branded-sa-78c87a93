import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingCart, Eye, MousePointerClick } from "lucide-react";

type Range = "7" | "30" | "all";

type Row = {
  post_id: string;
  title: string;
  slug: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
};

export function RevenuePanel() {
  const [range, setRange] = useState<Range>("30");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  async function load() {
    setLoading(true);
    const since =
      range === "all" ? null : new Date(Date.now() - parseInt(range) * 86400000).toISOString();

    const postsQ = supabase
      .from("posts")
      .select("id,title,slug")
      .eq("status", "published");

    const viewsQ = supabase
      .from("post_views")
      .select("post_id,viewed_at")
      .limit(20000);

    const clicksQ = supabase
      .from("blog_clicks")
      .select("post_id,clicked_at")
      .limit(20000);

    const convQ = supabase
      .from("blog_conversions")
      .select("post_id,total_amount,ordered_at")
      .limit(20000);

    const [posts, views, clicks, convs] = await Promise.all([postsQ, viewsQ, clicksQ, convQ]);

    const inRange = (iso: string) => !since || iso >= since;

    const map = new Map<string, Row>();
    for (const p of (posts.data as any[]) ?? [])
      map.set(p.id, {
        post_id: p.id,
        title: p.title,
        slug: p.slug,
        views: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
      });

    for (const v of (views.data as any[]) ?? []) {
      const r = map.get(v.post_id);
      if (r && inRange(v.viewed_at)) r.views++;
    }
    for (const c of (clicks.data as any[]) ?? []) {
      const r = map.get(c.post_id);
      if (r && inRange(c.clicked_at)) r.clicks++;
    }
    for (const c of (convs.data as any[]) ?? []) {
      const r = map.get(c.post_id);
      if (r && inRange(c.ordered_at)) {
        r.conversions++;
        r.revenue += Number(c.total_amount || 0);
      }
    }

    setRows([...map.values()].sort((a, b) => b.revenue - a.revenue || b.clicks - a.clicks));
    setLoading(false);
  }

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => ({
          views: acc.views + r.views,
          clicks: acc.clicks + r.clicks,
          conversions: acc.conversions + r.conversions,
          revenue: acc.revenue + r.revenue,
        }),
        { views: 0, clicks: 0, conversions: 0, revenue: 0 },
      ),
    [rows],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Revenue attribution</h2>
          <p className="text-sm text-muted-foreground">
            Sales driven by each blog post via tracked product links.
          </p>
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {(["7", "30", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-3 py-1 text-xs font-medium transition ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {r === "all" ? "All time" : `Last ${r}d`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi icon={<Eye className="h-4 w-4" />} label="Views" value={totals.views.toLocaleString()} />
        <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Clicks to shop" value={totals.clicks.toLocaleString()} />
        <Kpi icon={<ShoppingCart className="h-4 w-4" />} label="Conversions" value={totals.conversions.toLocaleString()} />
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Revenue (ZAR)" value={`R${totals.revenue.toFixed(2)}`} />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Blog title</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Conversions</th>
                <th className="px-4 py-3 text-right">CVR</th>
                <th className="px-4 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data yet.</td></tr>
              ) : (
                rows.map((r) => {
                  const cvr = r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0;
                  return (
                    <tr key={r.post_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <a href={`/blog/${r.slug}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                          {r.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{r.conversions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{cvr.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">R{r.revenue.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
