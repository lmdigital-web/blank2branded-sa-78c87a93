import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Eye, TrendingUp, FilePen } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type PostRow = { id: string; title: string; slug: string; status: string };
type ViewRow = { post_id: string; viewed_at: string };

function lastNDays(n: number) {
  const days: { key: string; label: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, label: d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) });
  }
  return days;
}

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pub, draft, cats] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      return {
        published: pub.count ?? 0,
        drafts: draft.count ?? 0,
        categories: cats.count ?? 0,
      };
    },
  });

  const { data: views } = useQuery({
    queryKey: ["admin-views-30"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 29);
      const { data, error } = await supabase
        .from("post_views")
        .select("post_id, viewed_at")
        .gte("viewed_at", since.toISOString());
      if (error) throw error;
      return (data ?? []) as ViewRow[];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["admin-published-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, status")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PostRow[];
    },
  });

  const days = lastNDays(30);
  const viewsByDay = days.map((d) => ({
    label: d.label,
    views: views?.filter((v) => v.viewed_at.slice(0, 10) === d.key).length ?? 0,
  }));
  const totalViews = views?.length ?? 0;
  const last7 = viewsByDay.slice(-7).reduce((s, d) => s + d.views, 0);
  const prev7 = viewsByDay.slice(-14, -7).reduce((s, d) => s + d.views, 0);
  const delta = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100);

  const viewsByPost = new Map<string, number>();
  views?.forEach((v) => viewsByPost.set(v.post_id, (viewsByPost.get(v.post_id) ?? 0) + 1));
  const topPosts = (posts ?? [])
    .map((p) => ({ ...p, views: viewsByPost.get(p.id) ?? 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Performance over the last 30 days.</p>
        </div>
        <Link to="/admin/posts/new"><Button><Plus className="h-4 w-4 mr-2" />New Post</Button></Link>
      </div>

      {/* KPI cards */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Views (30d)" value={totalViews.toLocaleString()} hint={`${last7} this week`} />
        <StatCard
          icon={TrendingUp}
          label="WoW trend"
          value={`${delta >= 0 ? "+" : ""}${delta}%`}
          hint={delta >= 0 ? "vs previous 7 days" : "vs previous 7 days"}
          tone={delta >= 0 ? "positive" : "negative"}
        />
        <StatCard icon={FileText} label="Published" value={stats?.published ?? "—"} />
        <StatCard icon={FilePen} label="Drafts" value={stats?.drafts ?? "—"} />
      </div>

      {/* Views trend chart */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Views — last 30 days</h2>
          <span className="text-xs text-muted-foreground">All published posts</span>
        </div>
        <div className="mt-4 h-72">
          <ClientOnly fallback={<div className="h-full" />}>
            {() => (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsByDay} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="vfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={3} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#vfill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ClientOnly>
        </div>
      </div>


      {/* Top posts + ranking */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Top posts by views</h2>
          <div className="mt-4 h-72">
            {topPosts.length === 0 ? (
              <EmptyState message="No views yet. Publish a post and share it to start tracking." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPosts} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="title"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={140}
                    tickFormatter={(t: string) => (t.length > 22 ? `${t.slice(0, 22)}…` : t)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Post leaderboard</h2>
            <Link to="/admin/posts" className="text-xs text-primary hover:underline">Manage posts →</Link>
          </div>
          <div className="mt-4 divide-y divide-border">
            {topPosts.length === 0 ? (
              <EmptyState message="No published posts ranked yet." />
            ) : topPosts.map((p, i) => (
              <div key={p.id} className="py-3 flex items-center gap-4">
                <span className="w-6 text-sm font-mono text-muted-foreground">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{p.title}</p>
                  <Link to="/blog/$slug" params={{ slug: p.slug }} className="text-xs text-muted-foreground hover:text-primary">
                    /blog/{p.slug}
                  </Link>
                </div>
                <span className="text-sm font-semibold">{p.views}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Sales-per-post tracking will appear here once posts include trackable product links.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className={`mt-2 text-3xl font-bold ${tone === "positive" ? "text-lime-600" : tone === "negative" ? "text-rose-600" : ""}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground px-6">
      {message}
    </div>
  );
}
