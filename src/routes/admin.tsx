import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Link } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ExternalLink, Eye, TrendingUp, Globe, Link2 } from "lucide-react";
import { toast } from "sonner";


type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
};

type View = {
  post_id: string;
  viewed_at: string;
  referrer: string | null;
  country: string | null;
};

type Range = "7" | "30" | "all";

export function AdminPage() {
  const { isAdmin, loading, user } = useIsAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [views, setViews] = useState<View[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [range, setRange] = useState<Range>("30");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) return;
    void loadData();
  }, [loading, user, isAdmin]);

  async function loadData() {
    setLoadingData(true);
    const [postsRes, viewsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id,slug,title,status,published_at,updated_at")
        .order("updated_at", { ascending: false }),
      supabase
        .from("post_views")
        .select("post_id,viewed_at,referrer,country")
        .order("viewed_at", { ascending: false })
        .limit(10000),
    ]);
    setPosts((postsRes.data as Post[]) ?? []);
    setViews((viewsRes.data as View[]) ?? []);
    setLoadingData(false);
  }

  const cutoffMs = useMemo(() => {
    if (range === "all") return 0;
    const days = parseInt(range, 10);
    return Date.now() - days * 24 * 60 * 60 * 1000;
  }, [range]);

  const filteredViews = useMemo(
    () => views.filter((v) => new Date(v.viewed_at).getTime() >= cutoffMs),
    [views, cutoffMs],
  );

  const viewsByPost = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filteredViews) m.set(v.post_id, (m.get(v.post_id) ?? 0) + 1);
    return m;
  }, [filteredViews]);

  const totalViews = filteredViews.length;
  const publishedCount = posts.filter((p) => p.status === "published").length;

  const topReferrers = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filteredViews) {
      let r = v.referrer?.trim() || "Direct";
      try {
        if (r !== "Direct") r = new URL(r).hostname.replace(/^www\./, "");
      } catch {}
      m.set(r, (m.get(r) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredViews]);

  const topCountries = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of filteredViews) {
      const c = v.country?.trim() || "Unknown";
      m.set(c, (m.get(c) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [filteredViews]);

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => (viewsByPost.get(b.id) ?? 0) - (viewsByPost.get(a.id) ?? 0)),
    [posts, viewsByPost],
  );

  async function onDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      void loadData();
    }
  }

  async function onLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header variant="solid" />
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Access denied</h1>
            <p className="mt-2 text-muted-foreground">You don't have admin permissions.</p>
            <Button onClick={onLogout} variant="outline" className="mt-4">Sign out</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const rangeLabel = range === "all" ? "all time" : `last ${range} days`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Blog Admin</h1>
              <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/quotes">
                <Button variant="outline">
                  <Inbox className="mr-2 h-4 w-4" /> Quote Requests
                </Button>
              </Link>
              <Link to="/admin/products">
                <Button variant="outline">
                  <Package className="mr-2 h-4 w-4" /> Products
                </Button>
              </Link>
              <Link to="/admin/posts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New post
                </Button>
              </Link>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>

          {/* Analytics dashboard */}
          <div className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Traffic — {rangeLabel}</h2>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard icon={<Eye className="h-4 w-4" />} label="Total views" value={totalViews.toLocaleString()} />
              <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Published posts" value={publishedCount.toString()} />
              <StatCard
                icon={<Eye className="h-4 w-4" />}
                label="Avg views / published post"
                value={publishedCount ? Math.round(totalViews / publishedCount).toLocaleString() : "0"}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <BreakdownCard title="Top referrers" icon={<Link2 className="h-4 w-4" />} rows={topReferrers} empty="No traffic yet" />
              <BreakdownCard title="Top countries" icon={<Globe className="h-4 w-4" />} rows={topCountries} empty="No location data" />
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Posts (sorted by views)</h2>
            </div>
            <table className="w-full">
              <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Views ({rangeLabel})</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : posts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No posts yet — create your first one.</td></tr>
                ) : (
                  sortedPosts.map((p) => {
                    const count = viewsByPost.get(p.id) ?? 0;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{p.title}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs ${p.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">
                          {count.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(p.updated_at).toLocaleDateString("en-ZA")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {p.status === "published" && (
                              <Link to={`/blog/${p.slug}`} target="_blank">
                                <Button size="sm" variant="ghost" title="View"><ExternalLink className="h-4 w-4" /></Button>
                              </Link>
                            )}
                            <Link to={`/admin/posts/${p.id}`}>
                              <Button size="sm" variant="ghost" title="Edit"><Edit className="h-4 w-4" /></Button>
                            </Link>
                            <Button size="sm" variant="ghost" title="Delete" onClick={() => onDelete(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  rows,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  rows: [string, number][];
  empty: string;
}) {
  const max = rows[0]?.[1] ?? 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([name, count]) => (
            <li key={name} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="truncate pr-2">{name}</span>
                <span className="tabular-nums text-muted-foreground">{count.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${max ? (count / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
