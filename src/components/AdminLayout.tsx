import { useEffect, useState, type ReactNode } from "react";
import { Link, navigate, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Inbox,
  FileText,
  LogOut,
  Menu,
  X,
  Home as HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  match?: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: <LayoutDashboard className="h-4 w-4" />,
    match: (p) => p === "/admin" || p.startsWith("/admin/posts"),
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: <Package className="h-4 w-4" />,
    match: (p) => p.startsWith("/admin/products"),
  },
  {
    label: "Quote Requests",
    to: "/admin/quotes",
    icon: <Inbox className="h-4 w-4" />,
    match: (p) => p.startsWith("/admin/quotes"),
  },
  {
    label: "Blog Posts",
    to: "/admin",
    icon: <FileText className="h-4 w-4" />,
    match: (p) => p.startsWith("/admin/posts"),
  },
];

interface Props {
  children: ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: Props) {
  const { isAdmin, loading, user } = useIsAdmin();
  const path = useCurrentPath();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login");
  }, [loading, user]);

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
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-muted-foreground">You don't have admin permissions.</p>
          <Button onClick={onLogout} variant="outline" className="mt-4">
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  const SidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <Link to="/admin" className="text-lg font-bold tracking-tight">
          Blank2Branded
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="px-5 pt-3 text-xs uppercase tracking-wider text-muted-foreground">
        Admin
      </p>
      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV.map((item) => {
          const active = item.match ? item.match(path) : path === item.to;
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <HomeIcon className="h-4 w-4" /> View site
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="px-3 pt-2 text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card lg:block">
        {SidebarBody}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-64 bg-card">{SidebarBody}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-base font-semibold lg:text-lg">{title}</h1>
          <div className="w-5 lg:hidden" />
        </header>
        <main className="flex-1 overflow-x-hidden px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
