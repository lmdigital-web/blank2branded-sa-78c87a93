import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, navigate } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type Post = {
  id: string;
  slug: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
};

export function AdminPage() {
  const { isAdmin, loading, user } = useIsAdmin();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!isAdmin) return;
    void loadPosts();
  }, [loading, user, isAdmin]);

  async function loadPosts() {
    setLoadingPosts(true);
    const { data } = await supabase
      .from("posts")
      .select("id,slug,title,status,published_at,updated_at")
      .order("updated_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoadingPosts(false);
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Post deleted");
      void loadPosts();
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
            <div className="flex gap-2">
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

          <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingPosts ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : posts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No posts yet — create your first one.</td></tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">{p.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs ${p.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                          {p.status}
                        </span>
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
                  ))
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
