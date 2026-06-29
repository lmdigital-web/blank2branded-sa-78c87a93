import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, MousePointerClick, Eye, TrendingUp, Hash } from "lucide-react";

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
type GscData = {
  site: string;
  range: { startDate: string; endDate: string; days: number };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  byDate: Row[];
  byQuery: Row[];
  byPage: Row[];
  byCountry: Row[];
};

type Range = 7 | 28 | 90;

export function SearchConsolePanel() {
  const [days, setDays] = useState<Range>(28);
  const [data, setData] = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("gsc-stats", {
          body: { days },
        });
        if (cancelled) return;
        if (err) throw err;
        if ((res as any)?.error) throw new Error((res as any).error);
        setData(res as GscData);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load Search Console data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const maxClicks = useMemo(
    () => Math.max(1, ...(data?.byDate.map((r) => r.clicks) ?? [0])),
    [data],
  );

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Search className="h-5 w-5" /> Google Search Console
          </h2>
          {data && (
            <p className="text-xs text-muted-foreground">
              {data.site.replace("sc-domain:", "")} · {data.range.startDate} → {data.range.endDate}
            </p>
          )}
        </div>
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {([7, 28, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setDays(r)}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                days === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Last {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Loading Search Console data…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <p className="mt-2 text-xs text-muted-foreground">
            Make sure the connected Google account owns <code>blank2branded.co.za</code> in Search
            Console.
          </p>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<MousePointerClick className="h-4 w-4" />} label="Clicks" value={data.totals.clicks.toLocaleString()} />
            <Stat icon={<Eye className="h-4 w-4" />} label="Impressions" value={data.totals.impressions.toLocaleString()} />
            <Stat icon={<TrendingUp className="h-4 w-4" />} label="CTR" value={`${(data.totals.ctr * 100).toFixed(2)}%`} />
            <Stat icon={<Hash className="h-4 w-4" />} label="Avg position" value={data.totals.position.toFixed(1)} />
          </div>

          {/* Clicks over time */}
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold">Clicks per day</div>
            {data.byDate.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="flex h-32 items-end gap-1">
                {data.byDate.map((r) => (
                  <div
                    key={r.keys?.[0]}
                    className="group relative flex-1 rounded-t bg-primary/80 transition hover:bg-primary"
                    style={{ height: `${(r.clicks / maxClicks) * 100}%`, minHeight: r.clicks > 0 ? 2 : 1 }}
                    title={`${r.keys?.[0]}: ${r.clicks} clicks · ${r.impressions} impressions`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <RowsCard title="Top queries" rows={data.byQuery} />
            <RowsCard title="Top pages" rows={data.byPage} truncatePath />
            <RowsCard title="Top countries" rows={data.byCountry} uppercaseKey />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function RowsCard({
  title,
  rows,
  truncatePath,
  uppercaseKey,
}: {
  title: string;
  rows: Row[];
  truncatePath?: boolean;
  uppercaseKey?: boolean;
}) {
  const max = rows[0]?.clicks ?? 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">{title}</div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.slice(0, 10).map((r) => {
            let label = r.keys?.[0] ?? "—";
            if (truncatePath) {
              try {
                label = new URL(label).pathname || "/";
              } catch {}
            }
            if (uppercaseKey) label = label.toUpperCase();
            return (
              <li key={label} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate pr-2" title={r.keys?.[0]}>{label}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {r.clicks.toLocaleString()} clicks · {r.impressions.toLocaleString()} impr
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${max ? (r.clicks / max) * 100 : 0}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
