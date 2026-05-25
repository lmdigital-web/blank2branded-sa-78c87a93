import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [posts, drafts, cats] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      return { published: posts.count ?? 0, drafts: drafts.count ?? 0, categories: cats.count ?? 0 };
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link to="/admin/posts/new"><Button><Plus className="h-4 w-4 mr-2" />New Post</Button></Link>
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Published posts</p>
          <p className="mt-2 text-3xl font-bold">{stats?.published ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Drafts</p>
          <p className="mt-2 text-3xl font-bold">{stats?.drafts ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="mt-2 text-3xl font-bold">{stats?.categories ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
