import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Globe, Hash, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Overview = {
  ascore?: number;
  total?: number;
  domains_num?: number;
  urls_num?: number;
  ips_num?: number;
  follows_num?: number;
  nofollows_num?: number;
  texts_num?: number;
  images_num?: number;
};

type RefDomain = { domain: string; domain_ascore?: number; backlinks_num?: number; ip?: string };
type Anchor = { anchor: string; domains_num?: number; backlinks_num?: number; first_seen?: string; last_seen?: string };
type Page = { source_url: string; source_title?: string; backlinks_num?: number; domains_num?: number; response_code?: number; last_seen?: string };

type Data = {
  target: string;
  target_type: string;
  overview: Overview | null;
  refDomains: RefDomain[];
  anchors: Anchor[];
  pages: Page[];
};

export function BacklinksPanel() {
  const [target, setTarget] = useState("blank2branded.co.za");
  const [pending, setPending] = useState("blank2branded.co.za");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("semrush-backlinks", {
          body: { target, target_type: "root_domain" },
        });
        if (cancelled) return;
        if (err) throw err;
        if ((res as any)?.error) throw new Error((res as any).error);
        setData(res as Data);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load backlinks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [target]);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Link2 className="h-5 w-5" /> Backlink Checker
          </h2>
          <p className="text-xs text-muted-foreground">Powered by Semrush · root domain analysis</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setTarget(pending.trim()); }}
          className="flex gap-2"
        >
          <Input
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder="example.com"
            className="w-64"
          />
          <Button type="submit" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Check
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Fetching backlink data for {target}…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
          <p className="mt-2 text-xs text-muted-foreground">
            If this is a quota error, upgrade your Semrush plan or wait for the daily reset.
          </p>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<Shield className="h-4 w-4" />} label="Authority Score" value={data.overview?.ascore?.toString() ?? "—"} />
            <Stat icon={<Link2 className="h-4 w-4" />} label="Total backlinks" value={(data.overview?.total ?? 0).toLocaleString()} />
            <Stat icon={<Globe className="h-4 w-4" />} label="Referring domains" value={(data.overview?.domains_num ?? 0).toLocaleString()} />
            <Stat icon={<Hash className="h-4 w-4" />} label="Referring IPs" value={(data.overview?.ips_num ?? 0).toLocaleString()} />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Follow" value={(data.overview?.follows_num ?? 0).toLocaleString()} />
            <Stat label="Nofollow" value={(data.overview?.nofollows_num ?? 0).toLocaleString()} />
            <Stat label="Text links" value={(data.overview?.texts_num ?? 0).toLocaleString()} />
            <Stat label="Image links" value={(data.overview?.images_num ?? 0).toLocaleString()} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RefDomainsCard rows={data.refDomains} />
            <AnchorsCard rows={data.anchors} />
          </div>

          <PagesCard rows={data.pages} />
        </>
      ) : null}
    </div>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
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

function RefDomainsCard({ rows }: { rows: RefDomain[] }) {
  const max = Math.max(1, ...rows.map((r) => r.backlinks_num ?? 0));
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">Top referring domains</div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No referring domains yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.domain} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="truncate pr-2 hover:underline">
                  {r.domain}
                </a>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  AS {r.domain_ascore ?? "—"} · {(r.backlinks_num ?? 0).toLocaleString()} links
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${((r.backlinks_num ?? 0) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnchorsCard({ rows }: { rows: Anchor[] }) {
  const max = Math.max(1, ...rows.map((r) => r.backlinks_num ?? 0));
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-sm font-semibold">Top anchor texts</div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No anchor data yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={`${r.anchor}-${i}`} className="text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate pr-2" title={r.anchor}>{r.anchor || "(empty)"}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {(r.backlinks_num ?? 0).toLocaleString()} · {r.domains_num ?? 0} dom
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${((r.backlinks_num ?? 0) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PagesCard({ rows }: { rows: Page[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold">Top linking pages</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Source page</th>
              <th className="px-4 py-2 text-right">Links</th>
              <th className="px-4 py-2 text-right">Domains</th>
              <th className="px-4 py-2">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No pages found.</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={`${r.source_url}-${i}`} className="border-b border-border last:border-0">
                  <td className="max-w-md truncate px-4 py-2">
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline" title={r.source_title || r.source_url}>
                      {r.source_title || r.source_url}
                    </a>
                    <div className="truncate text-xs text-muted-foreground">{r.source_url}</div>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{(r.backlinks_num ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.domains_num ?? 0}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {r.last_seen ? new Date(r.last_seen).toLocaleDateString("en-ZA") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
