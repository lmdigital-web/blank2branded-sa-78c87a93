import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, navigate, useCurrentPath } from "@/lib/static-router";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

type Mode = "new" | "edit";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: "draft" | "published";
  meta_title: string;
  meta_description: string;
  keywords: string;
};

const empty: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  status: "draft",
  meta_title: "",
  meta_description: "",
  keywords: "",
};

export function PostEditorPage() {
  const path = useCurrentPath();
  const { isAdmin, loading, user } = useIsAdmin();
  const isNew = path === "/admin/posts/new";
  const mode: Mode = isNew ? "new" : "edit";
  const postId = isNew ? null : path.replace(/^\/admin\/posts\//, "").replace(/\/$/, "");

  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!isNew);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) return;
    if (isNew) return;
    if (!postId) return;
    supabase
      .from("posts")
      .select("title,slug,excerpt,content,cover_image_url,status,meta_title,meta_description,keywords")
      .eq("id", postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Post not found");
          navigate("/admin");
          return;
        }
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          cover_image_url: data.cover_image_url || "",
          status: (data.status as "draft" | "published") || "draft",
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          keywords: data.keywords || "",
        });
        setLoadingPost(false);
      });
  }, [loading, user, isAdmin, isNew, postId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleBlur() {
    if (mode === "new" && !form.slug && form.title) {
      update("slug", slugify(form.title));
    }
  }

  async function onSave(publish: boolean) {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.slug.trim()) return toast.error("Slug is required");
    if (!form.content.trim() || form.content === "<p></p>") return toast.error("Content is required");

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url.trim() || null,
      status: publish ? "published" : form.status,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      keywords: form.keywords.trim() || null,
      published_at: publish ? new Date().toISOString() : null,
      author_id: user!.id,
    };

    let res;
    if (mode === "new") {
      res = await supabase.from("posts").insert(payload).select("id").single();
    } else {
      // Don't overwrite published_at on edits if already published and we're not republishing
      const update: any = { ...payload };
      if (!publish) delete update.published_at;
      res = await supabase.from("posts").update(update).eq("id", postId!).select("id").single();
    }
    setSaving(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(publish ? "Post published" : "Post saved");
    navigate("/admin");
  }

  if (loading || (mode === "edit" && loadingPost)) {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }
  if (!user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center">Access denied</div>;
  }

  const titleCount = form.meta_title.length;
  const descCount = form.meta_description.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="solid" />
      <main className="flex-1 bg-muted/30 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to posts
          </Link>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold">{mode === "new" ? "New Post" : "Edit Post"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" disabled={saving} onClick={() => onSave(false)}>
                <Save className="mr-2 h-4 w-4" /> Save draft
              </Button>
              <Button disabled={saving} onClick={() => onSave(true)}>
                Publish
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-lg border border-border bg-card p-5">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  onBlur={onTitleBlur}
                  placeholder="My amazing post"
                  className="mt-1"
                />
                <Label htmlFor="slug" className="mt-4 block">URL slug *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="my-amazing-post"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  blank2branded.co.za/blog/<span className="font-mono">{form.slug || "your-slug"}</span>
                </p>

                <Label htmlFor="excerpt" className="mt-4 block">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                  placeholder="A short summary shown on the blog list page."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <Label>Content *</Label>
                <div className="mt-2">
                  <RichTextEditor value={form.content} onChange={(html) => update("content", html)} />
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">Featured image</h3>
                <Label htmlFor="cover" className="mt-3 block text-sm">Image URL</Label>
                <Input
                  id="cover"
                  value={form.cover_image_url}
                  onChange={(e) => update("cover_image_url", e.target.value)}
                  placeholder="https://…"
                  className="mt-1"
                />
                {form.cover_image_url && (
                  <img src={form.cover_image_url} alt="" className="mt-3 aspect-video w-full rounded object-cover" />
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">SEO</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Optimise for Google. Leave blank to fall back to your title/excerpt.
                </p>

                <Label htmlFor="meta_title" className="mt-3 block text-sm">
                  Meta title <span className={`ml-1 text-xs ${titleCount > 60 ? "text-destructive" : "text-muted-foreground"}`}>({titleCount}/60)</span>
                </Label>
                <Input
                  id="meta_title"
                  value={form.meta_title}
                  onChange={(e) => update("meta_title", e.target.value)}
                  placeholder="DTF Printing Guide 2026 | Blank2Branded SA"
                  className="mt-1"
                />

                <Label htmlFor="meta_desc" className="mt-3 block text-sm">
                  Meta description <span className={`ml-1 text-xs ${descCount > 160 ? "text-destructive" : "text-muted-foreground"}`}>({descCount}/160)</span>
                </Label>
                <Textarea
                  id="meta_desc"
                  value={form.meta_description}
                  onChange={(e) => update("meta_description", e.target.value)}
                  placeholder="A compelling 150-character summary that appears in Google results."
                  rows={3}
                  className="mt-1"
                />

                <Label htmlFor="keywords" className="mt-3 block text-sm">Focus keywords</Label>
                <Textarea
                  id="keywords"
                  value={form.keywords}
                  onChange={(e) => update("keywords", e.target.value)}
                  placeholder="DTF printing South Africa, DTF transfers Mbombela, blank t-shirts wholesale"
                  rows={2}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Comma-separated. Use SA buyer search intent.</p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">Status</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Currently: <span className="font-medium text-foreground">{form.status}</span>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
