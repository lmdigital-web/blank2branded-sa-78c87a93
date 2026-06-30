import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Gauge, Smartphone, Monitor, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "@/lib/static-router";

type Metrics = { score: number; lcp: string | null; cls: string | null; fid: string | null; fcp: string | null; inp: string | null };
type Result = { url: string; mobile: Metrics; desktop: Metrics; fetched_at: string };

const SITE = "https://blank2branded.co.za";

async function fetchPSI(url: string): Promise<Result | { error: string }> {
  const { data, error } = await supabase.functions.invoke("pagespeed-stats", { body: { url } });
  if (error) return { error: error.message };
  return data as Result;
}

function scoreColor(s: number) {
  if (s >= 90) return "text-green-600 bg-green-50 border-green-200";
  if (s >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function MetricCard({ label, icon, m }: { label: string; icon: React.ReactNode; m: Metrics }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">{icon}{label}</div>
        <div className={`rounded-full border px-3 py-1 text-lg font-bold tabular-nums ${scoreColor(m.score)}`}>{m.score}</div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-muted-foreground">LCP</dt><dd className="font-medium tabular-nums">{m.lcp ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">CLS</dt><dd className="font-medium tabular-nums">{m.cls ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">FCP</dt><dd className="font-medium tabular-nums">{m.fcp ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">INP/TBT</dt><dd className="font-medium tabular-nums">{m.inp ?? m.fid ?? "—"}</dd></div>
      </dl>
    </div>
  );
}

export function SpeedPanel() {
  const [home, setHome] = useState<Result | null>(null);
  const [loadingHome, setLoadingHome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<{ id: string; slug: string; title: string }[]>([]);
  const [scans, setScans] = useState<Record<string, Result>>({});
  const [scanning, setScanning] = useState<string | null>(null);

  async function runHome() {
    setLoadingHome(true); setError(null);
    const r = await fetchPSI(SITE);
    if ("error" in r) setError(r.error); else setHome(r);
    setLoadingHome(false);
  }

  useEffect(() => {
    void runHome();
    supabase
      .from("posts")
      .select("id,slug,title")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setPosts(data ?? []));
  }, []);

  async function scanPost(p: { id: string; slug: string }) {
    setScanning(p.id);
    const r = await fetchPSI(`${SITE}/blog/${p.slug}`);
    if (!("error" in r)) setScans((s) => ({ ...s, [p.id]: r }));
    setScanning(null);
  }

  const flagged = posts
    .map((p) => ({ p, r: scans[p.id] }))
    .filter((x) => x.r && (x.r.mobile.score < 90 || x.r.desktop.score < 90));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" /> Core Web Vitals
          </h2>
          <p className="text-sm text-muted-foreground">Live PageSpeed Insights — mobile &amp; desktop.</p>
        </div>
        <Button variant="outline" size="sm" onClick={runHome} disabled={loadingHome}>
          {loadingHome ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Rescan homepage
        </Button>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

      {loadingHome && !home && (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Running Lighthouse on {SITE}… (15-25 sec)
        </div>
      )}

      {home && (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard label="Mobile" icon={<Smartphone className="h-4 w-4" />} m={home.mobile} />
          <MetricCard label="Desktop" icon={<Monitor className="h-4 w-4" />} m={home.desktop} />
        </div>
      )}

      {flagged.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle className="h-4 w-4" /> Optimization Needed ({flagged.length})
          </div>
          <ul className="divide-y divide-amber-200">
            {flagged.map(({ p, r }) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <span className="truncate pr-2 font-medium">{p.title}</span>
                <span className="flex items-center gap-3">
                  <span className="tabular-nums text-xs">M {r!.mobile.score} · D {r!.desktop.score}</span>
                  <Link to={`/admin/posts/${p.id}`}>
                    <Button size="sm" variant="outline"><ExternalLink className="mr-1 h-3 w-3" />Edit</Button>
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Scan published posts</h3>
        <p className="mb-3 text-xs text-muted-foreground">Pick a post to run PageSpeed on its live URL. Anything below 90 gets flagged above.</p>
        <ul className="divide-y divide-border">
          {posts.map((p) => {
            const s = scans[p.id];
            return (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="truncate pr-2">{p.title}</span>
                <span className="flex items-center gap-2">
                  {s && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      M <span className={s.mobile.score < 90 ? "font-bold text-amber-700" : "font-bold text-green-700"}>{s.mobile.score}</span>
                      {" · D "}
                      <span className={s.desktop.score < 90 ? "font-bold text-amber-700" : "font-bold text-green-700"}>{s.desktop.score}</span>
                    </span>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => scanPost(p)} disabled={scanning === p.id}>
                    {scanning === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Scan"}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
