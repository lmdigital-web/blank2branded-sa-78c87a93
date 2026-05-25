import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  category_id: string | null;
}

const empty: PostForm = {
  title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
  status: "draft", meta_title: "", meta_description: "", category_id: null,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function PostEditor({ postId }: { postId?: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<PostForm>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    supabase.from("posts").select("*").eq("id", postId).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          title: data.title ?? "",
          slug: data.slug ?? "",
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          cover_image_url: data.cover_image_url ?? "",
          status: (data.status as "draft" | "published") ?? "draft",
          meta_title: data.meta_title ?? "",
          meta_description: data.meta_description ?? "",
          category_id: data.category_id ?? null,
        });
      }
      setLoading(false);
    });
  }, [postId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        published_at: form.status === "published" ? new Date().toISOString() : null,
        author_id: u.user?.id,
      };
      if (postId) {
        const { error } = await supabase.from("posts").update(payload).eq("id", postId);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
        toast.success("Post created");
      }
      navigate({ to: "/admin/posts" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const update = <K extends keyof PostForm>(k: K, v: PostForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      <h1 className="text-3xl font-bold">{postId ? "Edit Post" : "New Post"}</h1>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={form.title}
          onChange={(e) => {
            update("title", e.target.value);
            if (!postId && !form.slug) update("slug", slugify(e.target.value));
          }}
        />
      </div>

      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" required value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} />
      </div>

      <div>
        <Label htmlFor="cover">Cover image URL</Label>
        <Input id="cover" type="url" value={form.cover_image_url} onChange={(e) => update("cover_image_url", e.target.value)} placeholder="https://..." />
      </div>

      <div>
        <Label htmlFor="cat">Category</Label>
        <select id="cat" value={form.category_id ?? ""} onChange={(e) => update("category_id", e.target.value || null)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">— None —</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea id="excerpt" rows={2} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" rows={16} required value={form.content} onChange={(e) => update("content", e.target.value)} />
      </div>

      <details className="rounded-md border border-border p-4">
        <summary className="cursor-pointer font-semibold">SEO meta</summary>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="meta_title">Meta title</Label>
            <Input id="meta_title" maxLength={60} value={form.meta_title} onChange={(e) => update("meta_title", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="meta_description">Meta description</Label>
            <Textarea id="meta_description" rows={2} maxLength={160} value={form.meta_description} onChange={(e) => update("meta_description", e.target.value)} />
          </div>
        </div>
      </details>

      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={form.status} onChange={(e) => update("status", e.target.value as "draft" | "published")}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/posts" })}>Cancel</Button>
      </div>
    </form>
  );
}
