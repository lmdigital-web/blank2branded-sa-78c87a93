import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2, Search, Copy, Eye, EyeOff } from "lucide-react";
import { ProductEditor } from "./ProductEditor";

type Row = {
  id: string;
  title: string;
  handle: string;
  status: "draft" | "published";
  base_price: number | null;
  currency_code: string;
  category_id: string | null;
  updated_at: string;
};

type Category = { id: string; name: string };

export function ProductsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [catFilter, setCatFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: prods, error }, { data: c }] = await Promise.all([
      supabase.from("shop_products")
        .select("id,title,handle,status,base_price,currency_code,category_id,updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("shop_categories").select("id,name").order("name"),
    ]);
    if (error) toast.error(error.message);
    setRows((prods as Row[]) ?? []);
    setCats((c as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (catFilter && r.category_id !== catFilter) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (!r.title.toLowerCase().includes(s) && !r.handle.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, q, statusFilter, catFilter]);

  const catName = (id: string | null) => (id ? cats.find((c) => c.id === id)?.name ?? "—" : "—");

  async function duplicate(id: string) {
    const { data: src } = await supabase.from("shop_products").select("*").eq("id", id).single();
    if (!src) return;
    const newHandle = `${src.handle}-copy-${Date.now().toString(36).slice(-4)}`;
    const { data: created, error } = await supabase.from("shop_products").insert({
      title: `${src.title} (copy)`,
      handle: newHandle,
      description: src.description,
      status: "draft",
      base_price: src.base_price,
      currency_code: src.currency_code,
      category_id: src.category_id,
      meta_title: src.meta_title,
      meta_description: src.meta_description,
    }).select("id").single();
    if (error) { toast.error(error.message); return; }
    // Copy variants + images
    const { data: variants } = await supabase.from("shop_product_variants").select("*").eq("product_id", id);
    const { data: images } = await supabase.from("shop_product_images").select("*").eq("product_id", id);
    type VRow = {
      option1_name: string | null; option1_value: string | null;
      option2_name: string | null; option2_value: string | null;
      option3_name: string | null; option3_value: string | null;
      price: number; currency_code: string; sku: string | null; available: boolean; position: number;
    };
    type IRow = { url: string; alt: string | null; position: number };
    if (variants?.length) {
      await supabase.from("shop_product_variants").insert(
        (variants as unknown as VRow[]).map((v) => ({
          product_id: created!.id,
          option1_name: v.option1_name, option1_value: v.option1_value,
          option2_name: v.option2_name, option2_value: v.option2_value,
          option3_name: v.option3_name, option3_value: v.option3_value,
          price: v.price, currency_code: v.currency_code, sku: v.sku,
          available: v.available, position: v.position,
        })),
      );
    }
    if (images?.length) {
      await supabase.from("shop_product_images").insert(
        (images as unknown as IRow[]).map((im) => ({
          product_id: created!.id, url: im.url, alt: im.alt, position: im.position,
        })),
      );
    }
    toast.success("Duplicated");
    void load();
  }

  async function togglePublish(id: string, current: "draft" | "published") {
    const next = current === "published" ? "draft" : "published";
    const { error } = await supabase.from("shop_products").update({ status: next }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(next === "published" ? "Product is now live" : "Moved to draft");
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: next } : r)));
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes its variants and image records too.`)) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); void load(); }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or handle…" className="pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All categories</option>
          {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New product
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Handle</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Base price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No products match. Add one with "New product".</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.handle}</td>
                  <td className="px-4 py-3 text-muted-foreground">{catName(r.category_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs ${r.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.base_price != null ? `${r.currency_code} ${Number(r.base_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant={r.status === "published" ? "outline" : "default"}
                        onClick={() => togglePublish(r.id, r.status)}
                        title={r.status === "published" ? "Unpublish (move to draft)" : "Publish live"}
                      >
                        {r.status === "published" ? (<><EyeOff className="mr-1 h-3.5 w-3.5" />Unpublish</>) : (<><Eye className="mr-1 h-3.5 w-3.5" />Publish</>)}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(r.id)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => duplicate(r.id)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id, r.title)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(editingId || creating) && (
        <ProductEditor
          productId={editingId}
          onClose={() => { setEditingId(null); setCreating(false); }}
          onSaved={() => { setEditingId(null); setCreating(false); void load(); }}
        />
      )}
    </>
  );
}
