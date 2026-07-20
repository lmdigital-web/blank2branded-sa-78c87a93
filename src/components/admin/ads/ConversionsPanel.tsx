import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Event = {
  id: string; event_type: string; value_cents: number | null; currency: string | null;
  utm_source: string | null; utm_medium: string | null; utm_campaign: string | null;
  url: string | null; created_at: string;
};

export function ConversionsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true);
    const { data } = await supabase.from("ad_events").select("*").order("created_at", { ascending: false }).limit(500);
    setEvents((data as Event[]) ?? []);
    setLoading(false);
  }

  const bySource = useMemo(() => {
    const m = new Map<string, { events: number; revenue: number }>();
    for (const e of events) {
      const src = e.utm_source || "direct";
      const cur = m.get(src) ?? { events: 0, revenue: 0 };
      cur.events++;
      if (e.event_type === "purchase") cur.revenue += (e.value_cents ?? 0) / 100;
      m.set(src, cur);
    }
    return [...m.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  }, [events]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 font-semibold">Revenue by source (attributed via UTM)</h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2">Source</th><th className="px-3 py-2 text-right">Events</th><th className="px-3 py-2 text-right">Revenue</th></tr>
            </thead>
            <tbody>
              {bySource.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No events yet.</td></tr>}
              {bySource.map(([src, s]) => (
                <tr key={src} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{src}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.events.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">R {s.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Recent events</h3>
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Campaign</th><th className="px-3 py-2 text-right">Value</th></tr>
            </thead>
            <tbody>
              {events.slice(0, 100).map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.created_at).toLocaleString("en-ZA")}</td>
                  <td className="px-3 py-2">{e.event_type}</td>
                  <td className="px-3 py-2">{e.utm_source ?? "—"}</td>
                  <td className="px-3 py-2">{e.utm_campaign ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{e.value_cents ? `R ${(e.value_cents / 100).toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
