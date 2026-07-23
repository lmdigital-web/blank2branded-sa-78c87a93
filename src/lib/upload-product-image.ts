import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_DIM = 1600;
const QUALITY = 0.82;

async function optimize(file: File): Promise<{ blob: Blob; ext: string; type: string }> {
  if (file.type === "image/gif" || file.type === "image/webp") {
    return { blob: file, ext: file.type === "image/gif" ? "gif" : "webp", type: file.type };
  }
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_DIM || height > MAX_DIM) {
      const r = Math.min(MAX_DIM / width, MAX_DIM / height);
      width = Math.round(width * r);
      height = Math.round(height * r);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", QUALITY),
    );
    return { blob, ext: "webp", type: "image/webp" };
  } catch {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    return { blob: file, ext, type: file.type };
  }
}

/**
 * Uploads a product image. Reuses the public `blog-images` bucket under a
 * `products/` prefix — the `product-images` bucket is private and the
 * workspace blocks flipping buckets to public.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Use JPG, PNG, WebP, GIF or AVIF");
  if (file.size > MAX_SIZE) throw new Error("Image must be under 10MB");
  const { blob, ext, type } = await optimize(file);
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, blob, { cacheControl: "31536000", upsert: false, contentType: type });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
