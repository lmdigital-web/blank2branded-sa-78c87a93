import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

type LinkRow = {
  id: string; name: string; target_url: string; utm_source: string; utm_medium: string;
  utm_campaign: string; utm_content: string | null; utm_term: string | null; full_url: string; clicks: number;
};

const SOURCES = ["facebook", "instagram", "tiktok", "google", "pinterest", "bing", "youtube", "linkedin", "email", "whatsapp"];
const MEDIUMS = ["cpc", "paid_social", "display", "email", "referral", "affiliate", "video"];

export function UtmBuilderPanel() {
  const [form, setForm] = useState({ name: "", target_url: "https://blank2branded.co.za/", utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "", utm_content: "", utm_term: "" });
  const [links, setLinks] = useState<LinkRow[]>([]);

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data } = await supabase.from("ad_utm_links").select("*").order("created_at", { ascending: false });
    setLinks((data as LinkRow[]) ?? []);
  }

  const preview = useMemo(() => buildUrl(form), [form]);

  async function save() {
    if (!form.name || !form.target_url || !form.utm_campaign) { toast.error("Name, URL and campaign required"); return; }
    const { error } = await supabase.from("ad_utm_links").insert({
      name: form.name, target_url: form.target_url, utm_source: form.utm_source,
      utm_medium: form.utm_medium, utm_campaign: form.utm_campaign,
      utm_content: form.utm_content || null, utm_term: form.utm_term || null,
      full_url: preview,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Link saved");
    setForm({ ...form, name: "", utm_campaign: "", utm_content: "", utm_term: "" });
    void load();
  }

  async function remove(id: string) {
    await supabase.from("ad_utm_links").delete().eq("id", id);
    void load();
  }

  function copy(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("Copied");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">Build a tagged URL</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Link name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FB Summer Sale — Video Ad A" /></div>
          <div><Label>Target URL</Label><Input value={form.target_url} onChange={(e) => setForm({ ...form, target_url: e.target.value })} /></div>
          <div>
            <Label>utm_source</Label>
            <Select value={form.utm_source} onValueChange={(v) => setForm({ ...form, utm_source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>utm_medium</Label>
            <Select value={form.utm_medium} onValueChange={(v) => setForm({ ...form, utm_medium: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEDIUMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>utm_campaign</Label><Input value={form.utm_campaign} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value })} placeholder="summer_dtf_2026" /></div>
          <div><Label>utm_content (optional)</Label><Input value={form.utm_content} onChange={(e) => setForm({ ...form, utm_content: e.target.value })} placeholder="video_a" /></div>
          <div><Label>utm_term (optional)</Label><Input value={form.utm_term} onChange={(e) => setForm({ ...form, utm_term: e.target.value })} placeholder="dtf+prints" /></div>
        </div>
        <div className="mt-3 rounded bg-muted p-2 text-xs break-all">{preview}</div>
        <div className="mt-3 flex gap-2">
          <Button onClick={save}>Save link</Button>
          <Button variant="outline" onClick={() => copy(preview)}><Copy className="mr-2 h-4 w-4" />Copy</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Source/Medium</th><th className="px-3 py-2">Campaign</th><th className="px-3 py-2 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {links.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No saved links yet.</td></tr>}
            {links.map((l) => (
              <tr key={l.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium">{l.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{l.utm_source} / {l.utm_medium}</td>
                <td className="px-3 py-2">{l.utm_campaign}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => copy(l.full_url)}><Copy className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildUrl(f: { target_url: string; utm_source: string; utm_medium: string; utm_campaign: string; utm_content: string; utm_term: string }) {
  try {
    const url = new URL(f.target_url);
    url.searchParams.set("utm_source", f.utm_source);
    url.searchParams.set("utm_medium", f.utm_medium);
    if (f.utm_campaign) url.searchParams.set("utm_campaign", f.utm_campaign);
    if (f.utm_content) url.searchParams.set("utm_content", f.utm_content);
    if (f.utm_term) url.searchParams.set("utm_term", f.utm_term);
    return url.toString();
  } catch {
    return f.target_url;
  }
}
