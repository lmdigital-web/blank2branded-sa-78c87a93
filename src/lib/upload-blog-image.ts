import { supabase } from "@/integrations/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function uploadBlogImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Use JPG, PNG, WebP, GIF or AVIF");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be under 5MB");
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
