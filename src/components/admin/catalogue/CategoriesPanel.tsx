import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import { slugify } from "@/lib/slugify";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number;
};

export function CategoriesPanel() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_categories")
      .select("id,name,slug,parent_id,position")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, Category[]>();
    for (const r of rows) {
      const key = r.parent_id ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }
    return byParent;
  }, [rows]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    const finalSlug = (slug.trim() || slugify(name)).slice(0, 80);
    const { error } = await supabase.from("shop_categories").insert({
      name: name.trim(),
      slug: finalSlug,
      parent_id: parentId || null,
      position: rows.filter((r) => (r.parent_id ?? "") === (parentId || "")).length,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Category added");
    setName(""); setSlug(""); setParentId("");
    void load();
  }

  async function rename(id: string, current: string) {
    const next = prompt("Rename category", current);
    if (!next || next === current) return;
    const { error } = await supabase.from("shop_categories").update({ name: next.trim() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Renamed"); void load(); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Products stay but lose their category link.")) return;
    const { error } = await supabase.from("shop_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); void load(); }
  }

  function renderBranch(parentId: string | null, depth: number): React.ReactNode {
    const items = tree.get(parentId) ?? [];
    if (items.length === 0) return null;
    return (
      <ul className={depth === 0 ? "space-y-1" : "mt-1 space-y-1"}>
        {items.map((c) => (
          <li key={c.id}>
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2" style={{ marginLeft: depth * 20 }}>
              {depth > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">/{c.slug}</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => rename(c.id, c.name)}>Rename</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
            {renderBranch(c.id, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Category tree</h3>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet — add your first on the right.</p>
        ) : (
          renderBranch(null, 0)
        )}
      </div>

      <form onSubmit={addCategory} className="rounded-lg border border-border bg-card p-4 space-y-3 h-fit">
        <h3 className="text-sm font-semibold">Add category</h3>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} placeholder="T-Shirts" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="t-shirts" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Parent (optional)</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— None (top-level)</option>
            {rows.filter((r) => !r.parent_id).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><Plus className="mr-2 h-4 w-4" />Add category</>)}
        </Button>
      </form>
    </div>
  );
}
