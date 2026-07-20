import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";

export function DashboardPanel() {
  const [stats, setStats] = useState({ campaigns: 0, activeCampaigns: 0, spend: 0, budget: 0, events: 0, purchases: 0, revenue: 0 });

  useEffect(() => { void load(); }, []);
  async function load() {
    const [campRes, evRes] = await Promise.all([
      supabase.from("ad_campaigns").select("status,budget_cents,spend_cents"),
      supabase.from("ad_events").select("event_type,value_cents").gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);
    const camps = (campRes.data as { status: string; budget_cents: number | null; spend_cents: number | null }[]) ?? [];
    const evs = (evRes.data as { event_type: string; value_cents: number | null }[]) ?? [];
    setStats({
      campaigns: camps.length,
      activeCampaigns: camps.filter((c) => c.status === "active").length,
      spend: camps.reduce((s, c) => s + (c.spend_cents ?? 0), 0) / 100,
      budget: camps.reduce((s, c) => s + (c.budget_cents ?? 0), 0) / 100,
      events: evs.length,
      purchases: evs.filter((e) => e.event_type === "purchase").length,
      revenue: evs.filter((e) => e.event_type === "purchase").reduce((s, e) => s + (e.value_cents ?? 0), 0) / 100,
    });
  }

  const roas = stats.spend > 0 ? (stats.revenue / stats.spend).toFixed(2) : "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card icon={<TrendingUp className="h-4 w-4" />} label="Active campaigns" value={`${stats.activeCampaigns} / ${stats.campaigns}`} />
        <Card icon={<DollarSign className="h-4 w-4" />} label="Spend (logged)" value={`R ${stats.spend.toLocaleString()}`} sub={`Budget: R ${stats.budget.toLocaleString()}`} />
        <Card icon={<ShoppingCart className="h-4 w-4" />} label="Purchases (30d)" value={stats.purchases.toString()} sub={`Revenue: R ${stats.revenue.toLocaleString()}`} />
        <Card icon={<MousePointerClick className="h-4 w-4" />} label="ROAS" value={roas === "—" ? "—" : `${roas}x`} sub={`${stats.events} tracking events`} />
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Quick start</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>Go to <strong>Pixels & Tags</strong> and paste each network's Pixel ID.</li>
          <li>Use the <strong>UTM Builder</strong> to tag every ad link so revenue attributes correctly.</li>
          <li>Log each ad you launch under <strong>Campaigns</strong> — track budget & spend for accurate ROAS.</li>
          <li>Watch <strong>Conversions</strong> to see what's actually driving sales.</li>
        </ol>
      </div>
    </div>
  );
}

function Card({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon}<span>{label}</span></div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
