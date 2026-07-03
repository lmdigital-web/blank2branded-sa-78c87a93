import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type Keyword = {
  id: string;
  keyword: string;
  target_url: string | null;
  status: "idea" | "drafting" | "published";
  priority: number;
  notes: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  idea: "bg-slate-100 text-slate-800 border-slate-200",
  drafting: "bg-amber-100 text-amber-800 border-amber-200",
  published: "bg-green-100 text-green-800 border-green-200",
};

export function KeywordsPanel() {
  const [rows, setRows] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKw, setNewKw] = useState({ keyword: "", target_url: "", notes: "", priority: 3 });

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("seo_keywords")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Keyword[]) ?? []);
    setLoading(false);
  }

  async function add() {
    if (!newKw.keyword.trim()) return;
    const { error } = await supabase.from("seo_keywords").insert({
      keyword: newKw.keyword.trim(),
      target_url: newKw.target_url.trim() || null,
      notes: newKw.notes.trim() || null,
      priority: newKw.priority,
      status: "idea",
    });
    if (error) return toast.error(error.message);
    toast.success("Keyword added");
    setNewKw({ keyword: "", target_url: "", notes: "", priority: 3 });
    void load();
  }

  async function updateRow(id: string, patch: Partial<Keyword>) {
    const { error } = await supabase.from("seo_keywords").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else void load();
  }

  async function del(id: string) {
    if (!confirm("Delete this keyword?")) return;
    const { error } = await supabase.from("seo_keywords").delete().eq("id", id);
    if (error) toast.error(error.message);
    else void load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Add a target keyword</h3>
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            className="md:col-span-2"
            placeholder="e.g. DTF transfers Cape Town"
            value={newKw.keyword}
            onChange={(e) => setNewKw({ ...newKw, keyword: e.target.value })}
          />
          <Input
            className="md:col-span-2"
            placeholder="Target URL (e.g. /dtf)"
            value={newKw.target_url}
            onChange={(e) => setNewKw({ ...newKw, target_url: e.target.value })}
          />
          <select
            className="rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={newKw.priority}
            onChange={(e) => setNewKw({ ...newKw, priority: Number(e.target.value) })}
          >
            <option value={5}>P1 - Critical</option>
            <option value={4}>P2 - High</option>
            <option value={3}>P3 - Medium</option>
            <option value={2}>P4 - Low</option>
            <option value={1}>P5 - Someday</option>
          </select>
          <Textarea
            className="md:col-span-5"
            placeholder="Notes: competitor observations, angle, intent…"
            rows={2}
            value={newKw.notes}
            onChange={(e) => setNewKw({ ...newKw, notes: e.target.value })}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Add keyword
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Keyword</th>
              <th className="px-3 py-2">Target URL</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No keywords yet — add one above.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 font-medium">{r.keyword}</td>
                <td className="px-3 py-2 text-muted-foreground">{r.target_url || "—"}</td>
                <td className="px-3 py-2 tabular-nums">P{6 - r.priority}</td>
                <td className="px-3 py-2">
                  <select
                    className={`rounded border px-2 py-0.5 text-xs ${STATUS_COLORS[r.status]}`}
                    value={r.status}
                    onChange={(e) => updateRow(r.id, { status: e.target.value as Keyword["status"] })}
                  >
                    <option value="idea">Idea</option>
                    <option value="drafting">Drafting</option>
                    <option value="published">Published</option>
                  </select>
                </td>
                <td className="max-w-xs px-3 py-2 text-xs text-muted-foreground">{r.notes || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="ghost" onClick={() => del(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
