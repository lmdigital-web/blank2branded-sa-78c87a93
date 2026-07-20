import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Edit } from "lucide-react";

type Campaign = {
  id: string;
  network: string;
  name: string;
  objective: string | null;
  status: string;
  budget_cents: number | null;
  spend_cents: number | null;
  start_date: string | null;
  end_date: string | null;
  utm_campaign: string | null;
  target_url: string | null;
  creative_url: string | null;
  ad_copy: string | null;
  notes: string | null;
};

const NETWORKS = [
  { id: "meta", label: "Meta (Facebook/Instagram)", url: "https://business.facebook.com/adsmanager" },
  { id: "tiktok", label: "TikTok Ads", url: "https://ads.tiktok.com/i18n/perf/campaign" },
  { id: "google", label: "Google Ads", url: "https://ads.google.com/aw/campaigns" },
  { id: "pinterest", label: "Pinterest Ads", url: "https://ads.pinterest.com/" },
  { id: "bing", label: "Microsoft / Bing", url: "https://ads.microsoft.com/" },
];

const OBJECTIVES = ["Awareness", "Traffic", "Engagement", "Leads", "App promotion", "Sales", "Retargeting"];
const STATUSES = ["draft", "active", "paused", "ended"];

const empty: Partial<Campaign> = { network: "meta", status: "draft", objective: "Sales", budget_cents: 0, spend_cents: 0 };

export function CampaignsPanel() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<Partial<Campaign> | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data } = await supabase.from("ad_campaigns").select("*").order("created_at", { ascending: false });
    setItems((data as Campaign[]) ?? []);
  }

  async function save() {
    if (!editing?.name || !editing.network) { toast.error("Name and network required"); return; }
    const payload = {
      ...editing,
      budget_cents: Number(editing.budget_cents) || 0,
      spend_cents: Number(editing.spend_cents) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("ad_campaigns").update(payload).eq("id", editing.id)
      : await supabase.from("ad_campaigns").insert(payload as never);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    void load();
  }

  async function remove(id: string) {
    if (!confirm("Delete campaign?")) return;
    await supabase.from("ad_campaigns").delete().eq("id", id);
    void load();
  }

  const totalBudget = items.reduce((s, c) => s + (c.budget_cents ?? 0), 0);
  const totalSpend = items.reduce((s, c) => s + (c.spend_cents ?? 0), 0);
  const active = items.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active" value={active.toString()} />
        <Stat label="Total Budget" value={`R ${(totalBudget / 100).toLocaleString()}`} />
        <Stat label="Total Spend" value={`R ${(totalSpend / 100).toLocaleString()}`} />
      </div>

      <div className="flex justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="mr-2 h-4 w-4" />New campaign</Button>
      </div>

      {editing && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div>
              <Label>Network</Label>
              <Select value={editing.network} onValueChange={(v) => setEditing({ ...editing, network: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{NETWORKS.map((n) => <SelectItem key={n.id} value={n.id}>{n.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objective</Label>
              <Select value={editing.objective ?? "Sales"} onValueChange={(v) => setEditing({ ...editing, objective: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Budget (ZAR)</Label><Input type="number" value={(editing.budget_cents ?? 0) / 100} onChange={(e) => setEditing({ ...editing, budget_cents: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label>Spend to date (ZAR)</Label><Input type="number" value={(editing.spend_cents ?? 0) / 100} onChange={(e) => setEditing({ ...editing, spend_cents: Math.round(Number(e.target.value) * 100) })} /></div>
            <div><Label>Start date</Label><Input type="date" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} /></div>
            <div><Label>End date</Label><Input type="date" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} /></div>
            <div><Label>Target URL</Label><Input value={editing.target_url ?? ""} onChange={(e) => setEditing({ ...editing, target_url: e.target.value })} placeholder="https://blank2branded.co.za/dtf" /></div>
            <div><Label>UTM campaign tag</Label><Input value={editing.utm_campaign ?? ""} onChange={(e) => setEditing({ ...editing, utm_campaign: e.target.value })} placeholder="summer-dtf-2026" /></div>
            <div className="sm:col-span-2"><Label>Creative URL (image/video)</Label><Input value={editing.creative_url ?? ""} onChange={(e) => setEditing({ ...editing, creative_url: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Ad copy</Label><Textarea rows={3} value={editing.ad_copy ?? ""} onChange={(e) => setEditing({ ...editing, ad_copy: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Notes</Label><Textarea rows={2} value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Network</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Budget</th>
              <th className="px-3 py-2 text-right">Spend</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No campaigns yet.</td></tr>}
            {items.map((c) => {
              const net = NETWORKS.find((n) => n.id === c.network);
              return (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">{net?.label ?? c.network}</td>
                  <td className="px-3 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{c.status}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">R {((c.budget_cents ?? 0) / 100).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">R {((c.spend_cents ?? 0) / 100).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {net && <a href={net.url} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost" title="Open ads manager"><ExternalLink className="h-4 w-4" /></Button></a>}
                      <Button size="sm" variant="ghost" onClick={() => setEditing(c)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
