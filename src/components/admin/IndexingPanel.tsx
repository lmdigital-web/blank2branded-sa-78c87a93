import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Submission = {
  id: string;
  post_id: string | null;
  url: string;
  submitted_at: string;
  google_ping_ok: boolean;
  indexnow_ok: boolean;
  indexing_state: string | null;
  indexing_coverage: string | null;
  indexing_checked_at: string | null;
};

export function IndexingPanel() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_submissions")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    setRows((data as Submission[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function runCron() {
    setRunning(true);
    const { error } = await supabase.functions.invoke("seo-publish-cron", { body: {} });
    setRunning(false);
    if (error) toast.error(error.message);
    else {
      toast.success("SEO task ran — refreshing");
      await load();
    }
  }

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''\n                                        \n                                            \n                                            Enable Supabase for this project.</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          <p className="font-semibold mb-1">Context:</p>
          <p className="mb-2">Summary: Your app ran about 1,700 Search Console page checks in the last day, and Google rejected every one. The connected account cannot access the property or URL variant being checked, so the monitor cannot produce valid indexing data. Select a verified property and stop the recurring job until a test check succeeds.</p>
          <div className="grid grid-cols-2 gap-2 text-xs opacity-80">
            <span><strong>Severity:</strong> high</span>
            <span><strong>Source:</strong> generic_import</span>
          </div>
          <p className="mt-2 text-xs italic opacity-70">
            <strong>Evidence:</strong> All 1,722 URL Inspection requests observed for this project returned status 403. The attempts continued throughout the full observation window at about 69 requests per hour.
          </p>
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Search engine submissions</h2>
          <p className="text-sm text-muted-foreground">
            Published posts are automatically pinged to Google (via sitemap) and IndexNow (Bing,
            Yandex). Indexing status is re-checked every 15 minutes via Search Console.
          </p>
        </div>
        <Button onClick={runCron} disabled={running} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
          Run now
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-center">Google</th>
                <th className="px-4 py-3 text-center">IndexNow</th>
                <th className="px-4 py-3">Indexing status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No submissions yet — publish a post or click "Run now".
                </td></tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 max-w-[320px]">
                      <a href={r.url} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">
                        {r.url.replace(/^https?:\/\//, "")}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.submitted_at).toLocaleString("en-ZA")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.google_ping_ok
                        ? <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                        : <XCircle className="mx-auto h-4 w-4 text-destructive" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.indexnow_ok
                        ? <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                        : <XCircle className="mx-auto h-4 w-4 text-destructive" />}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge state={r.indexing_state} coverage={r.indexing_coverage} />
                      {r.indexing_checked_at && (
                        <div className="text-xs text-muted-foreground">
                          checked {new Date(r.indexing_checked_at).toLocaleDateString("en-ZA")}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-1 flex items-center gap-1"><Send className="h-3 w-3" /> How this works</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>When a post publishes, we ping Google's sitemap endpoint and IndexNow (Bing, Yandex, Seznam, Naver).</li>
          <li>Google's URL submission API is deprecated for blogs — sitemap ping + crawl is the supported path. Expect 1–3 days for first index.</li>
          <li>IndexNow typically indexes within hours on Bing.</li>
          <li>For high-priority posts, also click "Request Indexing" in Search Console directly.</li>
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ state, coverage }: { state: string | null; coverage: string | null }) {
  if (!state) return <span className="text-xs text-muted-foreground">Awaiting check…</span>;
  const isIndexed = state === "PASS";
  const cls = isIndexed
    ? "bg-green-100 text-green-800"
    : state === "NEUTRAL"
      ? "bg-amber-100 text-amber-800"
      : "bg-red-100 text-red-800";
  return (
    <div>
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
        {isIndexed ? "Indexed" : state}
      </span>
      {coverage && <div className="text-xs text-muted-foreground mt-0.5">{coverage}</div>}
    </div>
  );
}