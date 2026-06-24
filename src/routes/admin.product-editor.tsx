import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Link, navigate, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Upload, Plus, GripVertical } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface ImageRow {
  id?: string;
  url: string;
  alt: string | null;
  position: number;
  _file?: File;
  _uploading?: boolean;
}

interface VariantRow {
  id?: string;
  option1_name: string | null;
  option1_value: string | null;
  option2_name: string | null;
  option2_value: string | null;
  option3_name: string | null;
  option3_value: string | null;
  price: string;
  sku: string;
  available: boolean;
}

interface FormState {
  title: string;
  handle: string;
  description: string;
  status: "draft" | "published";
  base_price: string;
  category_id: string;
  meta_title: string;
  meta_description: string;
}

const empty: FormState = {
  title: "",
  handle: "",
  description: "",
  status: "draft",
  base_price: "",
  category_id: "",
  meta_title: "",
  meta_description: "",
};

function newVariant(): VariantRow {
  return {
    option1_name: "Size",
    option1_value: "",
    option2_name: null,
    option2_value: null,
    option3_name: null,
    option3_value: null,
    price: "",
    sku: "",
    available: true,
  };
}

export function ProductEditorPage() {
  const path = useCurrentPath();
  const isNew = path === "/admin/products/new";
  const productId = isNew
    ? null
    : path.replace(/^\/admin\/products\//, "").replace(/\/$/, "");

  const [form, setForm] = useState<FormState>(empty);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([newVariant()]);
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(!isNew);

  useEffect(() => {
    void supabase
      .from("shop_categories")
      .select("id,name")
      .order("name")
      .then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  useEffect(() => {
    if (isNew || !productId) return;
    (async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select(
          "id,title,handle,description,status,base_price,category_id,meta_title,meta_description," +
            "shop_product_images(id,url,alt,position)," +
            "shop_product_variants(id,option1_name,option1_value,option2_name,option2_value,option3_name,option3_value,price,sku,available,position)",
        )
        .eq("id", productId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Product not found");
        navigate("/admin/products");
        return;
      }
      setForm({
        title: data.title ?? "",
        handle: data.handle ?? "",
        description: data.description ?? "",
        status: (data.status as "draft" | "published") ?? "draft",
        base_price: data.base_price != null ? String(data.base_price) : "",
        category_id: data.category_id ?? "",
        meta_title: data.meta_title ?? "",
        meta_description: data.meta_description ?? "",
      });
      const imgs = ((data as any).shop_product_images ?? [])
        .slice()
        .sort((a: any, b: any) => a.position - b.position)
        .map((i: any) => ({ id: i.id, url: i.url, alt: i.alt, position: i.position }));
      setImages(imgs);
      const vs = ((data as any).shop_product_variants ?? [])
        .slice()
        .sort((a: any, b: any) => a.position - b.position)
        .map((v: any) => ({
          id: v.id,
          option1_name: v.option1_name,
          option1_value: v.option1_value,
          option2_name: v.option2_name,
          option2_value: v.option2_value,
          option3_name: v.option3_name,
          option3_value: v.option3_value,
          price: v.price != null ? String(v.price) : "",
          sku: v.sku ?? "",
          available: v.available ?? true,
        }));
      setVariants(vs.length ? vs : [newVariant()]);
      setLoadingProduct(false);
    })();
  }, [isNew, productId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleBlur() {
    if (isNew && !form.handle && form.title) update("handle", slugify(form.title));
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const startPos = images.length;
    const arr = Array.from(files);
    const placeholders: ImageRow[] = arr.map((f, i) => ({
      url: URL.createObjectURL(f),
      alt: null,
      position: startPos + i,
      _file: f,
      _uploading: true,
    }));
    setImages((list) => [...list, ...placeholders]);

    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        setImages((list) => list.filter((x) => x._file !== file));
        continue;
      }
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setImages((list) =>
        list.map((x) =>
          x._file === file
            ? { url: data.publicUrl, alt: null, position: x.position, _uploading: false }
            : x,
        ),
      );
    }
  }

  function removeImage(idx: number) {
    setImages((list) => list.filter((_, i) => i !== idx).map((x, i) => ({ ...x, position: i })));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setImages((list) => {
      const next = [...list];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((x, i) => ({ ...x, position: i }));
    });
  }

  function updateVariant(idx: number, patch: Partial<VariantRow>) {
    setVariants((list) => list.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((list) => [...list, newVariant()]);
  }

  function removeVariant(idx: number) {
    setVariants((list) => (list.length === 1 ? list : list.filter((_, i) => i !== idx)));
  }

  const uploading = images.some((i) => i._uploading);

  async function onSave(publish: boolean) {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.handle.trim()) return toast.error("URL handle is required");
    if (uploading) return toast.error("Wait for images to finish uploading");

    const cleanVariants = variants.filter(
      (v) => (v.option1_value?.trim() || v.option2_value?.trim() || v.option3_value?.trim()) || v.price,
    );
    if (cleanVariants.length === 0) return toast.error("Add at least one variant");
    for (const v of cleanVariants) {
      if (!v.price || Number.isNaN(parseFloat(v.price))) {
        return toast.error("Each variant needs a price");
      }
    }

    setSaving(true);

    const productPayload = {
      title: form.title.trim(),
      handle: slugify(form.handle),
      description: form.description || null,
      status: publish ? "published" : form.status,
      base_price: form.base_price ? parseFloat(form.base_price) : parseFloat(cleanVariants[0].price),
      currency_code: "ZAR",
      category_id: form.category_id || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
    };

    let savedId = productId;
    if (isNew) {
      const { data, error } = await supabase
        .from("shop_products")
        .insert(productPayload)
        .select("id")
        .single();
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
      savedId = data.id;
    } else {
      const { error } = await supabase
        .from("shop_products")
        .update(productPayload)
        .eq("id", productId!);
      if (error) {
        setSaving(false);
        toast.error(error.message);
        return;
      }
    }

    // Replace images
    await supabase.from("shop_product_images").delete().eq("product_id", savedId!);
    if (images.length) {
      const imgRows = images.map((img, i) => ({
        product_id: savedId!,
        url: img.url,
        alt: img.alt,
        position: i,
      }));
      const { error: imgErr } = await supabase.from("shop_product_images").insert(imgRows);
      if (imgErr) toast.error(`Images: ${imgErr.message}`);
    }

    // Replace variants
    await supabase.from("shop_product_variants").delete().eq("product_id", savedId!);
    const varRows = cleanVariants.map((v, i) => ({
      product_id: savedId!,
      option1_name: v.option1_value ? v.option1_name : null,
      option1_value: v.option1_value || null,
      option2_name: v.option2_value ? v.option2_name : null,
      option2_value: v.option2_value || null,
      option3_name: v.option3_value ? v.option3_name : null,
      option3_value: v.option3_value || null,
      price: parseFloat(v.price),
      currency_code: "ZAR",
      sku: v.sku.trim() || null,
      available: v.available,
      position: i,
    }));
    const { error: varErr } = await supabase.from("shop_product_variants").insert(varRows);
    if (varErr) toast.error(`Variants: ${varErr.message}`);

    setSaving(false);
    toast.success(publish ? "Product published" : "Product saved");
    navigate("/admin/products");
  }

  if (loadingProduct) {
    return (
      <AdminLayout title="Product">
        <div className="py-12 text-center text-muted-foreground">Loading…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isNew ? "New product" : "Edit product"}>
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{isNew ? "New product" : form.title || "Edit product"}</h1>
        <div className="flex gap-2">
          <Button variant="outline" disabled={saving} onClick={() => onSave(false)}>
            <Save className="mr-2 h-4 w-4" /> Save draft
          </Button>
          <Button disabled={saving} onClick={() => onSave(true)}>
            {form.status === "published" ? "Update & publish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Basics */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              onBlur={onTitleBlur}
              placeholder="Mens Polo Shirt"
              className="mt-1"
            />
            <Label htmlFor="handle" className="mt-4 block">URL handle *</Label>
            <Input
              id="handle"
              value={form.handle}
              onChange={(e) => update("handle", e.target.value)}
              placeholder="mens-polo-shirt"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              blank2branded.co.za/products/<span className="font-mono">{form.handle || "your-handle"}</span>
            </p>
          </div>

          {/* Description (rich text) */}
          <div className="rounded-lg border border-border bg-card p-5">
            <Label>Description</Label>
            <p className="text-xs text-muted-foreground">Rich text — add headings, lists, links and inline images.</p>
            <div className="mt-2">
              <RichTextEditor value={form.description} onChange={(html) => update("description", html)} />
            </div>
          </div>

          {/* Images */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Product images</Label>
                <p className="text-xs text-muted-foreground">First image is the main thumbnail.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted">
                <Upload className="h-4 w-4" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    void uploadFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            {images.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No images yet. Upload one or more.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((img, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-md border border-border bg-muted">
                    <img src={img.url} alt={img.alt ?? ""} className="aspect-square w-full object-cover" />
                    {img._uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
                        Uploading…
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 px-2 py-1 text-white">
                      <div className="flex gap-1 text-xs">
                        <button onClick={() => moveImage(idx, -1)} className="px-1 disabled:opacity-30" disabled={idx === 0}>↑</button>
                        <button onClick={() => moveImage(idx, 1)} className="px-1 disabled:opacity-30" disabled={idx === images.length - 1}>↓</button>
                      </div>
                      <button onClick={() => removeImage(idx)} className="text-xs hover:text-red-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <Label>Variants *</Label>
                <p className="text-xs text-muted-foreground">Add a row per size/colour combination.</p>
              </div>
              <Button size="sm" variant="outline" onClick={addVariant}>
                <Plus className="mr-1 h-4 w-4" /> Add variant
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 md:grid-cols-12"
                >
                  <div className="md:col-span-3">
                    <Label className="text-xs">Option 1 (e.g. Size)</Label>
                    <div className="mt-1 flex gap-1">
                      <Input
                        placeholder="Size"
                        value={v.option1_name ?? ""}
                        onChange={(e) => updateVariant(idx, { option1_name: e.target.value })}
                        className="w-24"
                      />
                      <Input
                        placeholder="M"
                        value={v.option1_value ?? ""}
                        onChange={(e) => updateVariant(idx, { option1_value: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Option 2 (e.g. Colour)</Label>
                    <div className="mt-1 flex gap-1">
                      <Input
                        placeholder="Colour"
                        value={v.option2_name ?? ""}
                        onChange={(e) => updateVariant(idx, { option2_name: e.target.value || null })}
                        className="w-24"
                      />
                      <Input
                        placeholder="Black"
                        value={v.option2_value ?? ""}
                        onChange={(e) => updateVariant(idx, { option2_value: e.target.value || null })}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Price (ZAR) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="199.99"
                      value={v.price}
                      onChange={(e) => updateVariant(idx, { price: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">SKU</Label>
                    <Input
                      placeholder=""
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end justify-between md:col-span-2">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={v.available}
                        onChange={(e) => updateVariant(idx, { available: e.target.checked })}
                      />
                      Available
                    </label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeVariant(idx)}
                      disabled={variants.length === 1}
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Status</h3>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => update("status", "draft")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${form.status === "draft" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
              >
                Draft
              </button>
              <button
                onClick={() => update("status", "published")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${form.status === "published" ? "border-primary bg-primary/10 text-primary" : "border-border"}`}
              >
                Published
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Category</h3>
            <select
              value={form.category_id}
              onChange={(e) => update("category_id", e.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">Base price</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Shown on the shop grid. Defaults to the first variant price if blank.
            </p>
            <Input
              type="number"
              step="0.01"
              value={form.base_price}
              onChange={(e) => update("base_price", e.target.value)}
              placeholder="199.99"
              className="mt-2"
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-semibold">SEO</h3>
            <Label htmlFor="mt" className="mt-3 block text-sm">Meta title</Label>
            <Input
              id="mt"
              value={form.meta_title}
              onChange={(e) => update("meta_title", e.target.value)}
              className="mt-1"
            />
            <Label htmlFor="md" className="mt-3 block text-sm">Meta description</Label>
            <Textarea
              id="md"
              rows={3}
              value={form.meta_description}
              onChange={(e) => update("meta_description", e.target.value)}
              className="mt-1"
            />
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}
