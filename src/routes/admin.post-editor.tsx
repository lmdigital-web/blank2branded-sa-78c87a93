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
import { ArrowLeft, Save, CalendarClock, Send, Eye, CheckCircle2, XCircle, ExternalLink, Upload, Loader2, RefreshCw } from "lucide-react";
import { computeSeoScore, seoBadge } from "@/lib/seo-score";
import { uploadBlogImage } from "@/lib/upload-blog-image";
import { useRef } from "react";

type Mode = "new" | "edit";

type PostStatus = "draft" | "scheduled" | "published";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: PostStatus;
  meta_title: string;
  meta_description: string;
  keywords: string;
  scheduled_date: string;
  scheduled_time: string;
  author_id: string;
  experience_notes: string;
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
  scheduled_date: "",
  scheduled_time: "",
  author_id: "",
  experience_notes: "",
};

type AuthorOption = { id: string; name: string; credentials: string | null };

export function PostEditorPage() {
  const path = useCurrentPath();
  const { isAdmin, loading, user } = useIsAdmin();
  const isNew = path === "/admin/posts/new";
  const mode: Mode = isNew ? "new" : "edit";
  const postId = isNew ? null : path.replace(/^\/admin\/posts\//, "").replace(/\/$/, "");

  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!isNew);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [lastSeoScore, setLastSeoScore] = useState<number | null>(null);
  const [rechecking, setRechecking] = useState(false);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);

  useEffect(() => {
    supabase.from("authors").select("id,name,credentials").order("name").then(({ data }) => {
      setAuthors((data as AuthorOption[]) ?? []);
    });
  }, []);

  async function handleCoverUpload(file: File) {
    setUploadingCover(true);
    try {
      const url = await uploadBlogImage(file);
      update("cover_image_url", url);
      toast.success("Cover image uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingCover(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) return;
    if (isNew) return;
    if (!postId) return;
    supabase
      .from("posts")
      .select("title,slug,excerpt,content,cover_image_url,status,meta_title,meta_description,keywords,published_at,author_id,experience_notes")
      .eq("id", postId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Post not found");
          navigate("/admin");
          return;
        }
        const status = (data.status as PostStatus) || "draft";
        let sd = "";
        let st = "";
        if (status === "scheduled" && data.published_at) {
          const d = new Date(data.published_at);
          const pad = (n: number) => String(n).padStart(2, "0");
          sd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          st = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          cover_image_url: data.cover_image_url || "",
          status,
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
          keywords: data.keywords || "",
          scheduled_date: sd,
          scheduled_time: st,
          author_id: (data as { author_id: string | null }).author_id || "",
          experience_notes: (data as { experience_notes: string | null }).experience_notes || "",
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

  async function onSave(action: "draft" | "publish" | "schedule") {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.slug.trim()) return toast.error("Slug is required");
    if (!form.content.trim() || form.content === "<p></p>") return toast.error("Content is required");

    // E-E-A-T Quality Gate — required to publish or schedule
    if (action !== "draft") {
      if (!form.author_id) return toast.error("Assign an Author before publishing (E-E-A-T)");
      if ((form.experience_notes || "").trim().length < 80) {
        return toast.error("Add Information Gain / First-Hand Experience notes (≥80 chars) before publishing");
      }
    }

    let scheduledAt: Date | null = null;
    if (action === "schedule") {
      if (!form.scheduled_date || !form.scheduled_time) {
        return toast.error("Pick a date and time to schedule");
      }
      scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}`);
      if (isNaN(scheduledAt.getTime())) return toast.error("Invalid schedule date/time");
      if (scheduledAt.getTime() <= Date.now()) {
        return toast.error("Scheduled time must be in the future");
      }
    }

    setSaving(true);
    const nextStatus: PostStatus =
      action === "publish" ? "published" : action === "schedule" ? "scheduled" : "draft";

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url.trim() || null,
      status: nextStatus,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      keywords: form.keywords.trim() || null,
      author_id: form.author_id || null,
      experience_notes: form.experience_notes.trim() || null,
      created_by: user!.id,
      published_at: null as string | null,
    };

    if (action === "publish") payload.published_at = new Date().toISOString();
    else if (action === "schedule") payload.published_at = scheduledAt!.toISOString();
    

    let res;
    if (mode === "new") {
      res = await supabase.from("posts").insert(payload).select("id").single();
    } else {
      res = await supabase.from("posts").update(payload).eq("id", postId!).select("id").single();
    }
    setSaving(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    // Fire-and-forget submission to Google Indexing API + IndexNow + Social webhook on publish
    if (action === "publish") {
      const newId = (res.data as { id: string }).id;
      supabase.functions
        .invoke("notify-search-engines", { body: { post_id: newId } })
        .then(({ error }) => {
          if (error) console.error("notify-search-engines failed", error);
          else toast.success("Index Request Sent to Google + IndexNow");
        });
      supabase.functions
        .invoke("social-webhook-dispatch", { body: { post_id: newId } })
        .then(({ data, error }) => {
          if (error) { console.error("social-webhook-dispatch failed", error); return; }
          const d = data as { status?: string; skipped?: boolean } | null;
          if (d?.status === "sent") toast.success("Social webhook delivered");
          else if (d?.status === "failed") toast.error("Social webhook failed — see blog list");
        });
    }

    toast.success(
      action === "publish" ? "Post published" :
      action === "schedule" ? `Scheduled for ${scheduledAt!.toLocaleString("en-ZA")}` :
      "Draft saved"
    );
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

  const selectedAuthor = authors.find((a) => a.id === form.author_id);
  const seo = computeSeoScore({
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    cover_image_url: form.cover_image_url,
    meta_title: form.meta_title,
    meta_description: form.meta_description,
    keywords: form.keywords,
    author_name: selectedAuthor?.name,
    author_credentials: selectedAuthor?.credentials || "",
    experience_notes: form.experience_notes,
  });
  const seoB = seoBadge(seo.score);
  const failingChecks = seo.checks.filter((c) => !c.pass);
  const passingChecks = seo.checks.filter((c) => c.pass);


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
            <div className="flex flex-wrap gap-2">
              {mode === "edit" && postId && (
                <Link to={`/admin/preview/${postId}`} target="_blank">
                  <Button variant="outline" type="button">
                    <Eye className="mr-2 h-4 w-4" /> Preview
                  </Button>
                </Link>
              )}
              <Button variant="outline" disabled={saving} onClick={() => onSave("draft")}>
                <Save className="mr-2 h-4 w-4" /> Save draft
              </Button>
              <Button variant="secondary" disabled={saving} onClick={() => onSave("schedule")}>
                <CalendarClock className="mr-2 h-4 w-4" /> Schedule post
              </Button>
              <Button disabled={saving} onClick={() => onSave("publish")}>
                <Send className="mr-2 h-4 w-4" /> Publish now
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
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploadingCover ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {uploadingCover ? "Uploading…" : "Upload image"}
                  </Button>
                  {form.cover_image_url && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => update("cover_image_url", "")}>
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverUpload(f);
                    e.target.value = "";
                  }}
                />
                <Label htmlFor="cover" className="mt-4 block text-xs text-muted-foreground">Or paste an image URL</Label>
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
                <h3 className="font-semibold">E-E-A-T Quality Gate</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Required before publishing. Boosts trust signals for Google.
                </p>

                <Label htmlFor="author_id" className="mt-3 block text-sm">Author *</Label>
                <select
                  id="author_id"
                  value={form.author_id}
                  onChange={(e) => update("author_id", e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Select an author —</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}{a.credentials ? ` — ${a.credentials}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Manage author profiles under Admin → Authors.
                </p>

                <Label htmlFor="experience_notes" className="mt-4 block text-sm">
                  Information Gain / First-Hand Experience *
                  <span className={`ml-1 text-xs ${form.experience_notes.trim().length < 80 ? "text-destructive" : "text-muted-foreground"}`}>
                    ({form.experience_notes.trim().length}/80 min)
                  </span>
                </Label>
                <Textarea
                  id="experience_notes"
                  value={form.experience_notes}
                  onChange={(e) => update("experience_notes", e.target.value)}
                  placeholder="What unique data, case studies, or first-hand insights does this post add that Google can't find elsewhere?"
                  rows={4}
                  className="mt-1"
                />
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
                <h3 className="font-semibold flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" /> Schedule
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pick a future date &amp; time, then click <strong>Schedule post</strong>. It will auto-publish at that time (your local timezone).
                </p>
                <Label htmlFor="sched_date" className="mt-3 block text-sm">Date</Label>
                <Input
                  id="sched_date"
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => update("scheduled_date", e.target.value)}
                  className="mt-1"
                />
                <Label htmlFor="sched_time" className="mt-3 block text-sm">Time</Label>
                <Input
                  id="sched_time"
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => update("scheduled_time", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">SEO Analysis</h3>
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${seoB.color}`}>
                    {seo.score}/100 · {seoB.label}
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${seoB.bar} transition-all`} style={{ width: `${seo.score}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {seo.words} words · keyword density {seo.density.toFixed(2)}%
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={rechecking}
                  onClick={() => {
                    setRechecking(true);
                    setTimeout(() => {
                      const prev = lastSeoScore;
                      const delta = prev === null ? 0 : seo.score - prev;
                      const msg =
                        prev === null
                          ? `SEO score: ${seo.score}/100`
                          : delta > 0
                            ? `SEO improved by ${delta} → ${seo.score}/100 🎉`
                            : delta < 0
                              ? `SEO dropped by ${Math.abs(delta)} → ${seo.score}/100`
                              : `No change · still ${seo.score}/100`;
                      (delta >= 0 ? toast.success : toast.error)(msg);
                      setLastSeoScore(seo.score);
                      setRechecking(false);
                    }, 250);
                  }}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${rechecking ? "animate-spin" : ""}`} />
                  {rechecking ? "Rechecking…" : "Recheck SEO"}
                </Button>
                {lastSeoScore !== null && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Last checked: {lastSeoScore}/100
                  </p>
                )}

                {failingChecks.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Fix these ({failingChecks.length})
                    </p>
                    <ul className="space-y-2">
                      {failingChecks.map((c) => (
                        <li key={c.id} className="flex gap-2 text-sm">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                          <div>
                            <div className="font-medium leading-tight">{c.label}</div>
                            <div className="text-xs text-muted-foreground">{c.hint}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {passingChecks.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Passing ({passingChecks.length})
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {passingChecks.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span className="leading-tight">{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">Status</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Currently: <span className="font-medium text-foreground capitalize">{form.status}</span>
                </p>
                {mode === "edit" && postId && (
                  <Link to={`/admin/preview/${postId}`} target="_blank" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Open preview in new tab
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
