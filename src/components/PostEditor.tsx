import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";

interface PostForm {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  keywords: string;
  category_id: string | null;
}

const empty: PostForm = {
  title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
  status: "draft", meta_title: "", meta_description: "", keywords: "", category_id: null,
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
          keywords: (data as { keywords?: string }).keywords ?? "",
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

  const effectiveTitle = form.meta_title || form.title || "Your post title";
  const effectiveDesc = form.meta_description || form.excerpt || "Your post description will appear here.";
  const effectiveSlug = form.slug || slugify(form.title) || "post-slug";

  return (
    <form onSubmit={save} className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{postId ? "Edit Post" : "New Post"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Fields marked with * are required.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/posts" })}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : form.status === "published" ? "Publish" : "Save draft"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" required value={form.title}
                onChange={(e) => {
                  update("title", e.target.value);
                  if (!postId && !form.slug) update("slug", slugify(e.target.value));
                }}
              />
            </div>

            <div>
              <Label htmlFor="slug">URL slug *</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <span className="text-muted-foreground">/blog/</span>
                <input
                  id="slug"
                  required
                  value={form.slug}
                  onChange={(e) => update("slug", slugify(e.target.value))}
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea id="excerpt" rows={2} value={form.excerpt}
                onChange={(e) => update("excerpt", e.target.value)}
                placeholder="A short summary shown on the blog index and used as the default meta description." />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <div className="mt-1">
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => update("content", html)}
                  placeholder="Write your post here. Use the toolbar to add headings, lists, links and images."
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {form.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length} words ·
                ~{Math.max(1, Math.round(form.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200))} min read
              </p>
            </div>
          </div>

          {/* SEO — open by default, prominent */}
          <SeoPanel
            form={form}
            update={update}
            effectiveTitle={effectiveTitle}
            effectiveDesc={effectiveDesc}
            effectiveSlug={effectiveSlug}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-semibold">Publishing</h3>
            <div>
              <Label htmlFor="status">Status</Label>
              <select id="status" value={form.status}
                onChange={(e) => update("status", e.target.value as "draft" | "published")}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="draft">Draft (not visible)</option>
                <option value="published">Published (live on site)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="cat">Category</Label>
              <select id="cat" value={form.category_id ?? ""}
                onChange={(e) => update("category_id", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">— None —</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-semibold">Cover image</h3>
            <Input type="url" value={form.cover_image_url}
              onChange={(e) => update("cover_image_url", e.target.value)}
              placeholder="https://..." />
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="Cover preview" className="rounded-md border border-border w-full aspect-video object-cover" />
            )}
            <p className="text-xs text-muted-foreground">Used at the top of the post and as the social share image.</p>
          </div>
        </div>
      </div>
    </form>
  );
}

function SeoPanel({
  form, update, effectiveTitle, effectiveDesc, effectiveSlug,
}: {
  form: PostForm;
  update: <K extends keyof PostForm>(k: K, v: PostForm[K]) => void;
  effectiveTitle: string;
  effectiveDesc: string;
  effectiveSlug: string;
}) {
  const titleLen = effectiveTitle.length;
  const descLen = effectiveDesc.length;

  const checks = useMemo(() => {
    const w = form.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
    return [
      { ok: titleLen >= 30 && titleLen <= 60, label: `Meta title 30–60 chars (now ${titleLen})` },
      { ok: descLen >= 70 && descLen <= 160, label: `Meta description 70–160 chars (now ${descLen})` },
      { ok: !!form.cover_image_url, label: "Cover image set (used for social share)" },
      { ok: w >= 300, label: `At least 300 words (${w} so far)` },
      { ok: !!form.keywords.trim(), label: "Target keywords entered" },
    ];
  }, [form.content, form.cover_image_url, form.keywords, titleLen, descLen]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">SEO &amp; Google ranking</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="meta_title">Meta title</Label>
          <Input id="meta_title" maxLength={70} value={form.meta_title}
            onChange={(e) => update("meta_title", e.target.value)}
            placeholder={form.title || "Title shown in Google search results"} />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.meta_title.length}/60 recommended. Falls back to the post title if empty.
          </p>
        </div>

        <div>
          <Label htmlFor="meta_description">Meta description</Label>
          <Textarea id="meta_description" rows={3} maxLength={200} value={form.meta_description}
            onChange={(e) => update("meta_description", e.target.value)}
            placeholder="One or two sentences that summarise the post for search engines." />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.meta_description.length}/160 recommended.
          </p>
        </div>

        <div>
          <Label htmlFor="keywords">Target keywords</Label>
          <Input id="keywords" value={form.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            placeholder="comma, separated, phrases" />
          <p className="mt-1 text-xs text-muted-foreground">For your own tracking — also written into the page meta keywords tag.</p>
        </div>
      </div>

      {/* Google preview */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Google preview</p>
        <div className="mt-2 rounded-md border border-border bg-background p-4">
          <p className="text-xs text-muted-foreground truncate">yoursite.com › blog › {effectiveSlug}</p>
          <p className="mt-1 text-lg text-[#1a0dab] dark:text-blue-400 leading-snug line-clamp-1">{effectiveTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{effectiveDesc}</p>
        </div>
      </div>

      {/* Checklist */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SEO checklist</p>
        <ul className="mt-2 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? (
                <CheckCircle2 className="h-4 w-4 text-lime-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
