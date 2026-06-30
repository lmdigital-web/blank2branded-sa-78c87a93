import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchShopifyCatalog, type CatalogProduct } from "@/lib/shopify-catalog";

type Issue = {
  id: string;
  post_id: string;
  url: string;
  status_code: number | null;
  issue_type: string;
  suggested_handle: string | null;
  resolved_at: string | null;
  last_checked_at: string;
  post?: { title: string; slug: string } | null;
};

export function BrokenLinksPanel() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [fixing, setFixing] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_link_issues")
      .select("*, post:posts(title,slug)")
      .order("last_checked_at", { ascending: false });
    if (error) toast.error(error.message);
    setIssues((data as Issue[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    fetchShopifyCatalog().then(setProducts).catch(() => {});
  }, []);

  async function rescan() {
    setScanning(true);
    const { error } = await supabase.functions.invoke("scan-blog-links", { body: {} });
    setScanning(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Link scan complete");
      await load();
    }
  }

  async function fix(issue: Issue) {
    const handle = picks[issue.id] || issue.suggested_handle;
    if (!handle) {
      toast.error("Pick a replacement product first");
      return;
    }
    setFixing(issue.id);
    const { error } = await supabase.functions.invoke("fix-blog-link", {
      body: { issue_id: issue.id, new_handle: handle },
    });
    setFixing(null);
    if (error) toast.error(error.message);
    else {
      toast.success("Link fixed and post updated");
      await load();
    }
  }

  const unresolved = useMemo(() => issues.filter((i) => !i.resolved_at), [issues]);
  const visible = showResolved ? issues : unresolved;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Broken link & 404 monitor</h2>
          <p className="text-sm text-muted-foreground">
            Scans published blog content for outbound shop links pointing to deleted products or 404s.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowResolved((v) => !v)}>
            {showResolved ? "Hide resolved" : "Show resolved"}
          </Button>
          <Button onClick={rescan} disabled={scanning} variant="outline" size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${scanning ? "animate-spin" : ""}`} />
            Rescan now
          </Button>
        </div>
      </div>

      {/* SEO Health Alerts widget */}
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          unresolved.length > 0
            ? "border-destructive/30 bg-destructive/5"
            : "border-green-200 bg-green-50"
        }`}
      >
        {unresolved.length > 0 ? (
          <AlertTriangle className="h-5 w-5 text-destructive" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {unresolved.length > 0
              ? `${unresolved.length} broken link${unresolved.length === 1 ? "" : "s"} in blog content`
              : "All blog shop links are healthy"}
          </div>
          <div className="text-xs text-muted-foreground">
            Use the inline fix below to swap a broken link to a live product.
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Post</th>
                <th className="px-4 py-3">Broken URL</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Replacement</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {unresolved.length === 0 ? "Nothing broken — click \"Rescan now\" to check again." : "No issues."}
                </td></tr>
              ) : (
                visible.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {i.post ? (
                        <a href={`/blog/${i.post.slug}`} target="_blank" rel="noreferrer" className="hover:text-primary">
                          {i.post.title}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs break-all text-xs text-muted-foreground">{i.url}</td>
                    <td className="px-4 py-3">
                      {i.resolved_at ? (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Fixed
                        </span>
                      ) : (
                        <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          {i.issue_type} {i.status_code ? `(${i.status_code})` : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {i.resolved_at ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <select
                          value={picks[i.id] || i.suggested_handle || ""}
                          onChange={(e) => setPicks((p) => ({ ...p, [i.id]: e.target.value }))}
                          className="w-full max-w-xs rounded border border-input bg-background px-2 py-1 text-xs"
                        >
                          <option value="">Choose product…</option>
                          {products.map((p) => (
                            <option key={p.handle} value={p.handle}>
                              {p.title} {p.availableForSale ? "" : "(OOS)"}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!i.resolved_at && (
                        <Button size="sm" onClick={() => fix(i)} disabled={fixing === i.id}>
                          {fixing === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wrench className="h-3 w-3" />}
                          <span className="ml-1">Fix link</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
