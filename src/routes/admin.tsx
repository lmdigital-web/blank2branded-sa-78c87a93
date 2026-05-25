import { createFileRoute, Link, useNavigate, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, FileText, Tag, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Admin — Blank2Branded" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id)
        .eq("role", "admin");
      setIsAdmin(!!roles && roles.length > 0);
    })();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-muted-foreground">Your account doesn't have admin permissions.</p>
          <Button onClick={signOut} className="mt-6">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border bg-card p-6 flex flex-col">
        <h2 className="text-xl font-bold">Admin</h2>
        <nav className="mt-8 flex flex-col gap-1 text-sm">
          <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "bg-accent text-accent-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/admin/posts" activeProps={{ className: "bg-accent text-accent-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">
            <FileText className="h-4 w-4" /> Posts
          </Link>
          <Link to="/admin/categories" activeProps={{ className: "bg-accent text-accent-foreground" }} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted">
            <Tag className="h-4 w-4" /> Categories
          </Link>
        </nav>
        <div className="mt-auto space-y-2">
          <Link to="/" className="block text-xs text-muted-foreground hover:text-primary">← Back to site</Link>
          <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
