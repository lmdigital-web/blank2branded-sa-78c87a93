import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ImagePlus, Wand2, GripVertical } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { uploadProductImage } from "@/lib/upload-product-image";

type Category = { id: string; name: string; parent_id: string | null };

type EditorImage = {
  id?: string;
  url: string;
  alt: string | null;
  position: number;
  _pending?: boolean;
};

type EditorVariant = {
  id?: string;
  option1_name: string; option1_value: string;
  option2_name: string; option2_value: string;
  option3_name: string; option3_value: string;
  price: string;
  sku: string;
  available: boolean;
  position: number;
};

type EditorBranding = {
  id?: string;
  branding_type: string;
  position: string;
  branding_size: string;
  max_colour_count: string;
  unit_cost: string;
  setup_fee: string;
};

type Props = {
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY_VARIANT = (): EditorVariant => ({
  option1_name: "", option1_value: "",
  option2_name: "", option2_value: "",
  option3_name: "", option3_value: "",
  price: "",
  sku: "",
  available: true,
  position: 0,
});

const EMPTY_BRANDING = (): EditorBranding => ({
  branding_type: "",
  position: "",
  branding_size: "",
  max_colour_count: "1",
  unit_cost: "0",
  setup_fee: "0",
});

export function ProductEditor({ productId, onClose, onSaved }: Props) {
  const isNew = !productId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [basePrice, setBasePrice] = useState<string>("");
  const [currency, setCurrency] = useState("ZAR");
  const [categoryId, setCategoryId] = useState<string>("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");

  const [images, setImages] = useState<EditorImage[]>([]);
  const [variants, setVariants] = useState<EditorVariant[]>([]);
  const [uploading, setUploading] = useState(false);

  // Variant generator inputs
  const [genOpt1Name, setGenOpt1Name] = useState("Colour");
  const [genOpt1Values, setGenOpt1Values] = useState("");
  const [genOpt2Name, setGenOpt2Name] = useState("Size");
  const [genOpt2Values, setGenOpt2Values] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: c } = await supabase.from("shop_categories").select("id,name,parent_id").order("name");
      setCats((c as Category[]) ?? []);
      if (!isNew && productId) {
        const [prod, vars, imgs] = await Promise.all([
          supabase.from("shop_products").select("*").eq("id", productId).single(),
          supabase.from("shop_product_variants").select("*").eq("product_id", productId).order("position"),
          supabase.from("shop_product_images").select("*").eq("product_id", productId).order("position"),
        ]);
        if (prod.data) {
          const p = prod.data as Record<string, unknown>;
          setTitle((p.title as string) ?? "");
          setHandle((p.handle as string) ?? "");
          setHandleTouched(true);
          setDescription((p.description as string) ?? "");
          setStatus(((p.status as string) === "published" ? "published" : "draft"));
          setBasePrice(p.base_price != null ? String(p.base_price) : "");
          setCurrency((p.currency_code as string) ?? "ZAR");
          setCategoryId((p.category_id as string) ?? "");
          setMetaTitle((p.meta_title as string) ?? "");
          setMetaDesc((p.meta_description as string) ?? "");
        }
        setVariants(((vars.data ?? []) as Record<string, unknown>[]).map((v) => ({
          id: v.id as string,
          option1_name: (v.option1_name as string) ?? "",
          option1_value: (v.option1_value as string) ?? "",
          option2_name: (v.option2_name as string) ?? "",
          option2_value: (v.option2_value as string) ?? "",
          option3_name: (v.option3_name as string) ?? "",
          option3_value: (v.option3_value as string) ?? "",
          price: String(v.price ?? ""),
          sku: (v.sku as string) ?? "",
          available: v.available as boolean,
          position: v.position as number,
        })));
        setImages(((imgs.data ?? []) as Record<string, unknown>[]).map((i) => ({
          id: i.id as string,
          url: i.url as string,
          alt: (i.alt as string | null) ?? null,
          position: i.position as number,
        })));
        setLoading(false);
      } else {
        setLoading(false);
      }
    })();
  }, [productId, isNew]);

  const derivedHandle = useMemo(() => (handleTouched ? handle : slugify(title)), [handle, handleTouched, title]);

  async function onUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: EditorImage[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadProductImage(f);
        uploaded.push({ url, alt: null, position: images.length + uploaded.length });
      }
      setImages([...images, ...uploaded]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setImages(next.map((im, idx) => ({ ...im, position: idx })));
  }

  function removeImage(idx: number) {
    setImages(images.filter((_, i) => i !== idx).map((im, i) => ({ ...im, position: i })));
  }

  function generateVariants() {
    const c = genOpt1Values.split(",").map((s) => s.trim()).filter(Boolean);
    const s = genOpt2Values.split(",").map((v) => v.trim()).filter(Boolean);
    const cList = c.length ? c : [""];
    const sList = s.length ? s : [""];
    if (!c.length && !s.length) { toast.error("Enter at least one option value"); return; }
    const generated: EditorVariant[] = [];
    let pos = 0;
    for (const cv of cList) {
      for (const sv of sList) {
        generated.push({
          option1_name: c.length ? genOpt1Name : "",
          option1_value: cv,
          option2_name: s.length ? genOpt2Name : "",
          option2_value: sv,
          option3_name: "",
          option3_value: "",
          price: basePrice || "0",
          sku: "",
          available: true,
          position: pos++,
        });
      }
    }
    setVariants(generated);
    toast.success(`Generated ${generated.length} variants`);
  }

  function addVariantRow() {
    setVariants([...variants, { ...EMPTY_VARIANT(), position: variants.length, price: basePrice || "0" }]);
  }

  function updateVariant(idx: number, patch: Partial<EditorVariant>) {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function removeVariant(idx: number) {
    setVariants(variants.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!title.trim()) { toast.error("Title required"); return; }
    const finalHandle = (derivedHandle || slugify(title)).slice(0, 80);
    if (!finalHandle) { toast.error("Handle required"); return; }
    if (basePrice && Number.isNaN(Number(basePrice))) { toast.error("Base price must be a number"); return; }
    for (const v of variants) {
      if (v.price === "" || Number.isNaN(Number(v.price))) { toast.error("All variants need a numeric price"); return; }
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        handle: finalHandle,
        description: description || null,
        status,
        base_price: basePrice ? Number(basePrice) : null,
        currency_code: currency || "ZAR",
        category_id: categoryId || null,
        meta_title: metaTitle || null,
        meta_description: metaDesc || null,
      };
      let pid = productId;
      if (isNew) {
        const { data, error } = await supabase.from("shop_products").insert(payload).select("id").single();
        if (error) throw error;
        pid = data.id;
      } else {
        const { error } = await supabase.from("shop_products").update(payload).eq("id", productId!);
        if (error) throw error;
      }
      const productIdNow = pid!;

      // Replace variants + images (simpler than a diff — small volumes).
      await supabase.from("shop_product_variants").delete().eq("product_id", productIdNow);
      if (variants.length) {
        const { error: vErr } = await supabase.from("shop_product_variants").insert(
          variants.map((v, i) => ({
            product_id: productIdNow,
            option1_name: v.option1_name || null,
            option1_value: v.option1_value || null,
            option2_name: v.option2_name || null,
            option2_value: v.option2_value || null,
            option3_name: v.option3_name || null,
            option3_value: v.option3_value || null,
            price: Number(v.price),
            currency_code: currency || "ZAR",
            sku: v.sku || null,
            available: v.available,
            position: i,
          })),
        );
        if (vErr) throw vErr;
      }
      await supabase.from("shop_product_images").delete().eq("product_id", productIdNow);
      if (images.length) {
        const { error: iErr } = await supabase.from("shop_product_images").insert(
          images.map((im, i) => ({
            product_id: productIdNow,
            url: im.url,
            alt: im.alt,
            position: i,
          })),
        );
        if (iErr) throw iErr;
      }
      toast.success(isNew ? "Product created" : "Product saved");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isNew ? "New product" : "Edit product"}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Basics */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Basics</h3>
              <div>
                <label className="text-xs font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unisex T-shirt" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium">Handle (URL)</label>
                  <Input value={derivedHandle} onChange={(e) => { setHandleTouched(true); setHandle(e.target.value); }} placeholder="unisex-t-shirt" />
                  <p className="text-[11px] text-muted-foreground mt-1">/products/{derivedHandle || "…"}/</p>
                </div>
                <div>
                  <label className="text-xs font-medium">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">— Uncategorised</option>
                    {cats.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Base price</label>
                  <Input inputMode="decimal" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="99.00" />
                </div>
                <div>
                  <label className="text-xs font-medium">Currency</label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium">Description</label>
                <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Fabric, GSM, sizing notes…" />
              </div>
            </section>

            {/* SEO */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO</h3>
              <div>
                <label className="text-xs font-medium">Meta title <span className="text-muted-foreground">({metaTitle.length}/60)</span></label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value.slice(0, 80))} />
              </div>
              <div>
                <label className="text-xs font-medium">Meta description <span className="text-muted-foreground">({metaDesc.length}/160)</span></label>
                <Textarea rows={2} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value.slice(0, 200))} />
              </div>
            </section>

            {/* Images */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Images</h3>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  Upload
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
                </label>
              </div>
              {images.length === 0 ? (
                <p className="text-xs text-muted-foreground">No images yet. First image becomes the primary thumbnail.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((im, idx) => (
                    <div key={im.url + idx} className="group relative overflow-hidden rounded-md border border-border">
                      <img src={im.url} alt={im.alt ?? ""} className="aspect-square w-full object-cover" />
                      {idx === 0 && <span className="absolute left-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">Primary</span>}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 p-1 opacity-0 transition group-hover:opacity-100">
                        <div className="flex gap-0.5">
                          <button type="button" onClick={() => moveImage(idx, idx - 1)} className="rounded bg-white/10 p-1 text-white hover:bg-white/20"><GripVertical className="h-3 w-3 rotate-90" /></button>
                          <button type="button" onClick={() => moveImage(idx, idx + 1)} className="rounded bg-white/10 p-1 text-white hover:bg-white/20"><GripVertical className="h-3 w-3 -rotate-90" /></button>
                        </div>
                        <button type="button" onClick={() => removeImage(idx)} className="rounded bg-red-500/80 p-1 text-white hover:bg-red-500"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Variants */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variants ({variants.length})</h3>
                <Button size="sm" variant="outline" onClick={addVariantRow}><Plus className="h-3.5 w-3.5 mr-1" />Add row</Button>
              </div>

              <div className="rounded-md border border-border bg-muted/30 p-3">
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Generate from options</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Option 1 name</label>
                    <Input value={genOpt1Name} onChange={(e) => setGenOpt1Name(e.target.value)} className="h-8" />
                    <Input placeholder="Red, Black, Navy" value={genOpt1Values} onChange={(e) => setGenOpt1Values(e.target.value)} className="h-8 mt-1" />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">Option 2 name</label>
                    <Input value={genOpt2Name} onChange={(e) => setGenOpt2Name(e.target.value)} className="h-8" />
                    <Input placeholder="S, M, L, XL" value={genOpt2Values} onChange={(e) => setGenOpt2Values(e.target.value)} className="h-8 mt-1" />
                  </div>
                </div>
                <Button size="sm" onClick={generateVariants} className="mt-2 w-full">Generate variants</Button>
                <p className="mt-1 text-[11px] text-muted-foreground">Uses the base price for every generated row — edit prices below afterwards. This replaces the current variant list.</p>
              </div>

              {variants.length > 0 && (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-2 py-2">Opt 1</th>
                        <th className="px-2 py-2">Opt 2</th>
                        <th className="px-2 py-2">Opt 3</th>
                        <th className="px-2 py-2 text-right">Price</th>
                        <th className="px-2 py-2">SKU</th>
                        <th className="px-2 py-2">Avail</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-2 py-1"><Input value={v.option1_value} onChange={(e) => updateVariant(i, { option1_value: e.target.value })} className="h-8" /></td>
                          <td className="px-2 py-1"><Input value={v.option2_value} onChange={(e) => updateVariant(i, { option2_value: e.target.value })} className="h-8" /></td>
                          <td className="px-2 py-1"><Input value={v.option3_value} onChange={(e) => updateVariant(i, { option3_value: e.target.value })} className="h-8" /></td>
                          <td className="px-2 py-1"><Input inputMode="decimal" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} className="h-8 text-right" /></td>
                          <td className="px-2 py-1"><Input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} className="h-8" /></td>
                          <td className="px-2 py-1 text-center">
                            <input type="checkbox" checked={v.available} onChange={(e) => updateVariant(i, { available: e.target.checked })} />
                          </td>
                          <td className="px-2 py-1">
                            <Button size="sm" variant="ghost" onClick={() => removeVariant(i)}><Trash2 className="h-3 w-3" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-2 border-t border-border bg-background px-6 py-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (isNew ? "Create product" : "Save changes")}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
