import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/posts/")({
  component: AdminPosts,
});

function AdminPosts() {
  const qc = useQueryClient();
  const { data: posts } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, slug, status, published_at, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Post deleted");
    qc.invalidateQueries({ queryKey: ["admin-posts"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Posts</h1>
        <Link to="/admin/posts/new"><Button><Plus className="h-4 w-4 mr-2" />New Post</Button></Link>
      </div>
      <div className="mt-8 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Updated</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!posts || posts.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No posts yet.</td></tr>
            ) : posts.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-4 font-medium">{p.title}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "published" ? "bg-lime/20 text-foreground" : "bg-muted text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-2">
                    <Link to="/admin/posts/$id" params={{ id: p.id }}>
                      <Button size="sm" variant="outline"><Pencil className="h-3 w-3" /></Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => del(p.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
