import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, Clock, ArrowUpRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type TrafficData = {
  activeUsers: number;
  totalUsers: number;
  sessions: number;
  avgSessionDuration: string;
  bounceRate: string;
  topPages: { pageTitle: string; pagePath: string; screenPageViews: number }[];
  topSources: { source: string; sessions: number }[];
};

export function TrafficPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrafficData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: pixels } = await supabase
        .from("ad_pixels")
        .select("extra")
        .eq("network", "google")
        .eq("enabled", true)
        .single();

      let ga4Id = (pixels?.extra as any)?.ga4_id;

      if (!ga4Id) {
        throw new Error("GA4 Property ID not found. Please add it in the Ads Manager tab.");
      }

      // If they provided a Measurement ID (G-XXXX), it won't work with the Data API.
      // We'll show a helpful hint if it looks like a Measurement ID.
      if (ga4Id.startsWith("G-")) {
        throw new Error("You provided a Measurement ID (G-XXXXXX), but the dashboard needs your numeric GA4 Property ID. Find it in Google Analytics Admin → Property Settings.");
      }

      const { data: res, error: err } = await supabase.functions.invoke("ga4-stats", {
        body: { days: 30, property_id: ga4Id },
      });
      if (err) throw err;
      setData(res as TrafficData);
    } catch (e: any) {
      setError(e.message || "Failed to load Google Analytics data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Connecting to Google Analytics API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          To fix this: Copy your <strong>numeric Property ID</strong> from Google Analytics Admin → Property Settings, and paste it into the <strong>GA4 Property ID</strong> field in the <strong>Ads Manager</strong> tab.
        </p>
        <Button variant="outline" size="sm" onClick={load} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> GA4 Real-time Traffic (Last 30 Days)
          </h3>
          <p className="text-sm text-muted-foreground">Live data from your connected Google Analytics property.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total Users" value={data?.totalUsers.toLocaleString() || "0"} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Sessions" value={data?.sessions.toLocaleString() || "0"} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Avg. Session" value={data?.avgSessionDuration || "0s"} />
        <StatCard icon={<ArrowUpRight className="h-4 w-4" />} label="Bounce Rate" value={data?.bounceRate || "0%"} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Visited Pages</h4>
          <div className="space-y-3">
            {data?.topPages.map((page, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div className="min-w-0 pr-4">
                  <div className="truncate text-sm font-medium">{page.pageTitle}</div>
                  <div className="truncate text-xs text-muted-foreground">{page.pagePath}</div>
                </div>
                <div className="text-right tabular-nums text-sm font-semibold">
                  {page.screenPageViews.toLocaleString()}
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">views</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Traffic Sources</h4>
          <div className="space-y-3">
            {data?.topSources.map((source, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                <div className="text-sm font-medium capitalize">{source.source || "Direct / None"}</div>
                <div className="text-right tabular-nums text-sm font-semibold">
                  {source.sessions.toLocaleString()}
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">sessions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function Activity({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
