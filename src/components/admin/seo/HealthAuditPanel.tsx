import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeSeoScore, seoBadge } from "@/lib/seo-score";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/static-router";
import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  author_id: string | null;
  experience_notes: string | null;
};

type AuthorLite = { id: string; name: string | null; credentials: string | null };


type RouteAudit = {
  path: string;
  label: string;
  meta_title: string;
  meta_description: string;
  issues: string[];
  score: number;
};

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
];

export function HealthAuditPanel({ onFixMeta }: { onFixMeta?: (search: string) => void } = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorLite>>({});
  const [routeMeta, setRouteMeta] = useState<Record<string, { title: string | null; description: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [postsRes, routesRes, authorsRes] = await Promise.all([
        supabase
          .from("posts")
          .select("id,slug,title,status,excerpt,content,cover_image_url,meta_title,meta_description,keywords,author_id,experience_notes")
          .eq("status", "published"),
        supabase.from("route_meta").select("slug,title,description"),
        supabase.from("authors").select("id,name,credentials"),
      ]);
      setPosts((postsRes.data ?? []) as Post[]);
      const map: Record<string, { title: string | null; description: string | null }> = {};
      for (const r of routesRes.data ?? []) map[r.slug] = { title: r.title, description: r.description };
      setRouteMeta(map);
      const amap: Record<string, AuthorLite> = {};
      for (const a of (authorsRes.data ?? []) as AuthorLite[]) amap[a.id] = a;
      setAuthors(amap);
      setLoading(false);
    })();
  }, []);

  const postAudits = useMemo(
    () =>
      posts
        .map((p) => {
          const author = p.author_id ? authors[p.author_id] : undefined;
          const seo = computeSeoScore({
            title: p.title || "",
            slug: p.slug || "",
            excerpt: p.excerpt || "",
            content: p.content || "",
            cover_image_url: p.cover_image_url || "",
            meta_title: p.meta_title || "",
            meta_description: p.meta_description || "",
            keywords: p.keywords || "",
            author_name: author?.name || "",
            author_credentials: author?.credentials || "",
            experience_notes: p.experience_notes || "",
          });
          return {
            id: p.id,
            path: `/blog/${p.slug}`,
            title: p.title,
            score: seo.score,
            failing: seo.checks.filter((c) => !c.pass),
          };
        })
        .sort((a, b) => a.score - b.score),
    [posts, authors],
  );


  const routeAudits: RouteAudit[] = useMemo(() => {
    const seenTitles = new Map<string, number>();
    const audits: RouteAudit[] = STATIC_ROUTES.map((r) => {
      const meta = routeMeta[r.slug];
      const t = meta?.title ?? "";
      const d = meta?.description ?? "";
      const issues: string[] = [];
      if (!t) issues.push("Missing meta title override (using default from prerender)");
      else if (t.length > 60) issues.push(`Title too long (${t.length} chars)`);
      else if (t.length < 30) issues.push(`Title too short (${t.length} chars)`);
      if (!d) issues.push("Missing meta description override");
      else if (d.length > 160) issues.push(`Description too long (${d.length} chars)`);
      else if (d.length < 120) issues.push(`Description too short (${d.length} chars)`);
      if (t) seenTitles.set(t, (seenTitles.get(t) ?? 0) + 1);
      const score = Math.max(0, 100 - issues.length * 20);
      return { path: r.slug, label: r.label, meta_title: t, meta_description: d, issues, score };
    });
    for (const a of audits) {
      if (a.meta_title && (seenTitles.get(a.meta_title) ?? 0) > 1) {
        a.issues.push("Duplicate meta title with another page");
        a.score = Math.max(0, a.score - 15);
      }
    }
    return audits.sort((a, b) => a.score - b.score);
  }, [routeMeta]);

  if (loading) return <p className="p-6 text-center text-muted-foreground">Auditing pages…</p>;

  const avgScore = Math.round(
    [...postAudits.map((p) => p.score), ...routeAudits.map((r) => r.score)].reduce((a, b) => a + b, 0) /
      Math.max(1, postAudits.length + routeAudits.length),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatBox label="Average SEO score" value={`${avgScore}/100`} tone={avgScore >= 80 ? "good" : avgScore >= 55 ? "ok" : "bad"} />
        <StatBox
          label="Pages needing work"
          value={`${[...postAudits, ...routeAudits].filter((r) => r.score < 80).length}`}
          tone="ok"
        />
        <StatBox
          label="Critical (<55)"
          value={`${[...postAudits, ...routeAudits].filter((r) => r.score < 55).length}`}
          tone="bad"
        />
      </div>

      <Section title="Static Pages — worst first">
        {routeAudits.map((r) => (
          <AuditRow
            key={r.path}
            path={r.path}
            title={r.label}
            score={r.score}
            issues={r.issues}
            onFix={onFixMeta ? () => onFixMeta(r.label) : undefined}
          />
        ))}
      </Section>

      <Section title="Blog Posts — worst first">
        {postAudits.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">No published posts yet.</p>
        )}
        {postAudits.map((p) => (
          <AuditRow
            key={p.id}
            path={p.path}
            title={p.title}
            score={p.score}
            issues={p.failing.slice(0, 4).map((c) => c.hint)}
            fixHref={`/admin/posts/${p.id}`}
          />
        ))}
      </Section>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: "good" | "ok" | "bad" }) {
  const color =
    tone === "good" ? "text-green-700" : tone === "ok" ? "text-amber-700" : "text-red-700";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function AuditRow({ path, title, score, issues, fixHref, onFix }: { path: string; title: string; score: number; issues: string[]; fixHref?: string; onFix?: () => void }) {
  const badge = seoBadge(score);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${badge.color}`}>
            {score}/100
          </span>
          <span className="font-medium">{title}</span>
          <Link to={path} target="_blank" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        {issues.length > 0 ? (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            <span>All checks passed</span>
          </div>
        )}
      </div>
      {issues.length > 0 && (
        onFix ? (
          <Button size="sm" variant="outline" onClick={onFix}>Fix</Button>
        ) : fixHref ? (
          <Link to={fixHref}>
            <Button size="sm" variant="outline">Fix</Button>
          </Link>
        ) : null
      )}
    </div>
  );
}
