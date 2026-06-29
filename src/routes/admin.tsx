import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, navigate } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, LogOut, ExternalLink, Eye, TrendingUp, Globe, Link2, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { SearchConsolePanel } from "@/components/admin/SearchConsolePanel";
import { computeSeoScore, seoBadge } from "@/lib/seo-score";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
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
  const [section, setSection] = useState<"blog" | "search">("blog");

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
    // Auto-promote scheduled posts whose time has passed to "published"
    await supabase
      .from("posts")
      .update({ status: "published" })
      .eq("status", "scheduled")
      .lte("published_at", new Date().toISOString());
    const [postsRes, viewsRes] = await Promise.all([
      supabase
        .from("posts")
        .select("id,slug,title,status,published_at,updated_at,excerpt,content,cover_image_url,meta_title,meta_description,keywords")
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

  const rangeLabel = range === "all" ? "all time" : `last ${range} days`;

  const navItems = [
    { id: "blog" as const, label: "Blog", icon: FileText },
    { id: "search" as const, label: "Google Search", icon: Search },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8 md:px-6">
          {/* Left sidebar nav */}
          <aside className="hidden w-56 shrink-0 md:block">
            <div className="sticky top-24 rounded-lg border border-border bg-card p-2">
              <div className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Admin
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-2 border-t border-border pt-2">
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          {/* Mobile section switcher */}
          <div className="md:hidden mb-4 flex w-full gap-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium ${
                    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {section === "blog" ? "Blog Admin" : "Google Search Console"}
                </h1>
                <p className="text-sm text-muted-foreground">Signed in as {user.email}</p>
              </div>
              {section === "blog" && (
                <div className="flex gap-2">
                  <Link to="/admin/posts/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> New post
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={onLogout} className="md:hidden">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                </div>
              )}
            </div>

            {section === "blog" && (
              <>
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
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">SEO</th>
                        <th className="px-4 py-3 text-right">Views ({rangeLabel})</th>
                        <th className="px-4 py-3">Updated</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                      ) : posts.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No posts yet — create your first one.</td></tr>
                      ) : (
                        sortedPosts.map((p) => {
                          const count = viewsByPost.get(p.id) ?? 0;
                          const seo = computeSeoScore({
                            title: p.title || "",
                            slug: p.slug || "",
                            excerpt: p.excerpt || "",
                            content: p.content || "",
                            cover_image_url: p.cover_image_url || "",
                            meta_title: p.meta_title || "",
                            meta_description: p.meta_description || "",
                            keywords: p.keywords || "",
                          });
                          const badge = seoBadge(seo.score);
                          return (
                            <tr key={p.id} className="border-b border-border last:border-0">
                              <td className="px-4 py-3 font-medium">{p.title}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block rounded px-2 py-0.5 text-xs ${p.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className={`inline-flex items-center gap-2 rounded border px-2 py-0.5 text-xs font-medium ${badge.color}`}
                                  title={`${badge.label} — ${seo.score}/100`}
                                >
                                  <span className="tabular-nums">{seo.score}</span>
                                  <span className="hidden sm:inline">/ 100</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-semibold">
                                {count.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {new Date(p.updated_at).toLocaleDateString("en-ZA")}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Link to={`/admin/preview/${p.id}`} target="_blank">
                                    <Button size="sm" variant="ghost" title="Preview"><Eye className="h-4 w-4" /></Button>
                                  </Link>
                                  {p.status === "published" && (
                                    <Link to={`/blog/${p.slug}`} target="_blank">
                                      <Button size="sm" variant="ghost" title="View live"><ExternalLink className="h-4 w-4" /></Button>
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
              </>
            )}

            {section === "search" && (
              <div className="mt-8">
                <SearchConsolePanel />
              </div>
            )}
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
