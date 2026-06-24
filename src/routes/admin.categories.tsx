import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  position: number;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface FormState {
  id?: string;
  name: string;
  slug: string;
  parent_id: string;
  position: number;
}

const EMPTY: FormState = { name: "", slug: "", parent_id: "", position: 0 };

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_categories")
      .select("id,name,slug,parent_id,position")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setCategories((data ?? []) as Category[]);

    const { data: prods } = await supabase
      .from("shop_products")
      .select("category_id");
    const counts: Record<string, number> = {};
    (prods ?? []).forEach((p: any) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    });
    setProductCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Category[]>();
    for (const c of categories) {
      const key = c.parent_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [categories]);

  const roots = childrenOf.get(null) ?? [];

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openNew(parentId: string | null = null) {
    const siblings = childrenOf.get(parentId) ?? [];
    const nextPos = siblings.length
      ? Math.max(...siblings.map((s) => s.position)) + 1
      : 0;
    setForm({ ...EMPTY, parent_id: parentId ?? "", position: nextPos });
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setForm({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id ?? "",
      position: cat.position,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Name is required");
    const slug = form.slug.trim() || slugify(form.name);
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug,
      parent_id: form.parent_id || null,
      position: form.position,
    };
    if (form.id) {
      const { error } = await supabase
        .from("shop_categories")
        .update(payload)
        .eq("id", form.id);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Category updated");
    } else {
      const { error } = await supabase.from("shop_categories").insert(payload);
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Category created");
    }
    setSaving(false);
    setOpen(false);
    load();
  }

  async function remove(cat: Category) {
    const kids = childrenOf.get(cat.id) ?? [];
    if (kids.length > 0) {
      return toast.error("Delete or move sub-categories first");
    }
    const count = productCounts[cat.id] ?? 0;
    if (count > 0) {
      if (!confirm(`This category has ${count} product(s). They will be uncategorised. Continue?`)) return;
    } else if (!confirm(`Delete "${cat.name}"?`)) {
      return;
    }
    const { error } = await supabase.from("shop_categories").delete().eq("id", cat.id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    load();
  }

  async function reorder(cat: Category, dir: -1 | 1) {
    const siblings = (childrenOf.get(cat.parent_id) ?? [])
      .slice()
      .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    const idx = siblings.findIndex((s) => s.id === cat.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const other = siblings[swapIdx];
    const updates = [
      supabase.from("shop_categories").update({ position: other.position }).eq("id", cat.id),
      supabase.from("shop_categories").update({ position: cat.position }).eq("id", other.id),
    ];
    const results = await Promise.all(updates);
    const err = results.find((r) => r.error);
    if (err?.error) return toast.error(err.error.message);
    load();
  }

  function Row({ cat, depth }: { cat: Category; depth: number }) {
    const kids = childrenOf.get(cat.id) ?? [];
    const isOpen = expanded.has(cat.id);
    const count = productCounts[cat.id] ?? 0;
    return (
      <>
        <div
          className="flex items-center gap-2 border-b border-border px-3 py-3 hover:bg-muted/50"
          style={{ paddingLeft: 12 + depth * 24 }}
        >
          <button
            onClick={() => kids.length && toggleExpanded(cat.id)}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground"
            aria-label="Expand"
          >
            {kids.length > 0 ? (
              isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-medium">{cat.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              /{cat.slug} · {count} product{count === 1 ? "" : "s"}
              {kids.length > 0 && ` · ${kids.length} sub`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => reorder(cat, -1)} title="Move up">
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => reorder(cat, 1)} title="Move down">
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => openNew(cat.id)} title="Add sub-category">
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => openEdit(cat)} title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => remove(cat)} title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {isOpen &&
          kids
            .slice()
            .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
            .map((k) => <Row key={k.id} cat={k} depth={depth + 1} />)}
      </>
    );
  }

  // Flat list of options for parent dropdown (exclude self + descendants)
  const parentOptions = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    function walk(parent: string | null, prefix: string) {
      const kids = (childrenOf.get(parent) ?? [])
        .slice()
        .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
      for (const k of kids) {
        if (form.id && k.id === form.id) continue;
        out.push({ id: k.id, label: prefix + k.name });
        walk(k.id, prefix + "— ");
      }
    }
    walk(null, "");
    return out;
  }, [childrenOf, form.id]);

  return (
    <AdminLayout title="Categories">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Categories</h2>
            <p className="text-sm text-muted-foreground">
              Organise your shop. Drag-free reordering with up/down arrows. Nest as deep as you need.
            </p>
          </div>
          <Button onClick={() => openNew(null)}>
            <Plus className="mr-2 h-4 w-4" /> New category
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : roots.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No categories yet. Create your first one.
            </div>
          ) : (
            roots
              .slice()
              .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
              .map((c) => <Row key={c.id} cat={c} depth={0} />)
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: f.id ? f.slug : slugify(name),
                  }));
                }}
                placeholder="e.g. T-Shirts"
              />
            </div>
            <div>
              <Label htmlFor="cat-slug">URL slug</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="t-shirts"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Used in URLs and filters. Lowercase, hyphens only.
              </p>
            </div>
            <div>
              <Label htmlFor="cat-parent">Parent category</Label>
              <select
                id="cat-parent"
                value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Top level —</option>
                {parentOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="cat-pos">Display order</Label>
              <Input
                id="cat-pos"
                type="number"
                value={form.position}
                onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) || 0 }))}
              />
              <p className="mt-1 text-xs text-muted-foreground">Lower numbers show first.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
