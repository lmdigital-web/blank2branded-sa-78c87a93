import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Save, ExternalLink, Trash2, Pencil, Eye, Send } from "lucide-react";
import { TEMPLATE_META, DEFAULT_CITIES, detectVideoPlatform, bofuUrl, type BofuTemplate } from "@/lib/bofu-templates";
import { slugify } from "@/lib/slugify";

type Draft = {
  title: string;
  meta_description: string;
  h1: string;
  intro: string;
  body_html: string;
  faq_json: { q: string; a: string }[];
};

type BofuRow = {
  id: string;
  slug: string;
  template: BofuTemplate;
  keyword: string;
  title: string;
  city: string | null;
  status: string;
  updated_at: string;
};

export function PageBuilderPanel({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [form, setForm] = useState({
    template: "versus" as BofuTemplate,
    keyword: initialKeyword,
    competitor: "",
    city: "Johannesburg",
    videoUrl: "",
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pages, setPages] = useState<BofuRow[]>([]);

  useEffect(() => { void loadPages(); }, []);
  useEffect(() => { if (initialKeyword) setForm((f) => ({ ...f, keyword: initialKeyword })); }, [initialKeyword]);

  async function loadPages() {
    const { data } = await supabase.from("bofu_pages").select("id,slug,template,keyword,title,city,status,updated_at").order("updated_at", { ascending: false });
    setPages((data as BofuRow[]) ?? []);
  }

  async function generate() {
    if (!form.keyword.trim()) { toast.error("Keyword required"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("bofu-generate-page", { body: form });
      if (error) throw error;
      setDraft(data as Draft);
      toast.success("Draft generated");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  async function save(status: "draft" | "published") {
    if (!draft) return;
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const slug = slugify(form.template === "versus"
        ? `blank2branded-vs-${form.competitor || form.keyword}`
        : form.template === "alternatives"
          ? `${form.competitor || form.keyword}-alternatives`
          : form.template === "best"
            ? form.keyword
            : form.keyword);
      const video = detectVideoPlatform(form.videoUrl);
      const payload = {
        slug,
        template: form.template,
        keyword: form.keyword,
        title: draft.title,
        meta_description: draft.meta_description,
        h1: draft.h1,
        intro: draft.intro,
        body_html: draft.body_html,
        faq_json: draft.faq_json,
        video_url: form.videoUrl || null,
        video_platform: video?.platform ?? null,
        video_embed_html: video?.embedHtml ?? null,
        city: form.template === "local" ? form.city : null,
        status,
        published_at: status === "published" ? new Date().toISOString() : null,
        author_id: u.user?.id,
      };
      const { error } = await supabase.from("bofu_pages").upsert(payload, { onConflict: "template,slug,city" });
      if (error) throw error;
      toast.success(status === "published" ? "Page published" : "Draft saved");
      setDraft(null);
      setEditingId(null);
      void loadPages();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  async function loadForEdit(id: string) {
    const { data, error } = await supabase.from("bofu_pages").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast.error(error?.message || "Not found"); return; }
    const row = data as any;
    setForm({
      template: row.template,
      keyword: row.keyword ?? "",
      competitor: form.competitor,
      city: row.city ?? "Johannesburg",
      videoUrl: row.video_url ?? "",
    });
    setDraft({
      title: row.title ?? "",
      meta_description: row.meta_description ?? "",
      h1: row.h1 ?? "",
      intro: row.intro ?? "",
      body_html: row.body_html ?? "",
      faq_json: Array.isArray(row.faq_json) ? row.faq_json : [],
    });
    setEditingId(id);
    toast.success("Loaded for editing");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function quickPublish(id: string) {
    const { error } = await supabase.from("bofu_pages").update({ status: "published", published_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Published"); void loadPages(); }
  }

  async function del(id: string) {
    if (!confirm("Delete this page?")) return;
    const { error } = await supabase.from("bofu_pages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); void loadPages(); }
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold">Build a BOFU page</h3>
          <div>
            <label className="text-xs font-medium">Template</label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.template}
              onChange={(e) => setForm({ ...form, template: e.target.value as BofuTemplate })}
            >
              {(Object.keys(TEMPLATE_META) as BofuTemplate[]).map((k) => (
                <option key={k} value={k}>{TEMPLATE_META[k].label} — {TEMPLATE_META[k].prefix}/…</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Focus keyword / query *</label>
            <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="best DTF prints in Cape Town" />
          </div>
          {(form.template === "versus" || form.template === "alternatives") && (
            <div>
              <label className="text-xs font-medium">Competitor brand</label>
              <Input value={form.competitor} onChange={(e) => setForm({ ...form, competitor: e.target.value })} placeholder="Vicbay" />
            </div>
          )}
          {form.template === "local" && (
            <div>
              <label className="text-xs font-medium">City</label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                {DEFAULT_CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium">Short-form video URL (YouTube / TikTok / Reels)</label>
            <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/shorts/…" />
            {form.videoUrl && (
              <p className="mt-1 text-xs text-muted-foreground">
                Detected: {detectVideoPlatform(form.videoUrl)?.platform ?? "unknown platform"}
              </p>
            )}
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {busy ? "Generating (20-40s)…" : "Generate page with AI"}
          </Button>
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{editingId ? "Editing existing page" : "Draft preview"}</h3>
            {editingId && (
              <Button size="sm" variant="ghost" onClick={() => { setDraft(null); setEditingId(null); }}>Cancel</Button>
            )}
          </div>
          {!draft && <p className="p-6 text-center text-sm text-muted-foreground">Generate a draft or click Edit on an existing page.</p>}
          {draft && (
            <div className="space-y-3">
              <div><label className="text-xs font-medium">Title</label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Meta description ({draft.meta_description.length}/160)</label><Textarea rows={2} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} /></div>
              <div><label className="text-xs font-medium">H1</label><Input value={draft.h1} onChange={(e) => setDraft({ ...draft, h1: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Intro</label><Textarea rows={3} value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} /></div>
              <div><label className="text-xs font-medium">Body HTML</label><Textarea rows={10} value={draft.body_html} onChange={(e) => setDraft({ ...draft, body_html: e.target.value })} className="font-mono text-xs" /></div>
              <div>
                <label className="text-xs font-medium">FAQ ({draft.faq_json.length})</label>
                <Textarea rows={6} value={JSON.stringify(draft.faq_json, null, 2)} onChange={(e) => { try { setDraft({ ...draft, faq_json: JSON.parse(e.target.value) }); } catch {} }} className="font-mono text-xs" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => save("draft")} disabled={saving} variant="outline" className="flex-1"><Save className="mr-1 h-4 w-4" />Save draft</Button>
                <Button onClick={() => save("published")} disabled={saving} className="flex-1"><Send className="mr-1 h-4 w-4" />{editingId ? "Save & publish" : "Publish"}</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Existing BOFU pages ({pages.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2">Title</th><th className="px-4 py-2">Template</th><th className="px-4 py-2">URL</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {pages.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No BOFU pages yet.</td></tr>}
              {pages.map((p) => {
                const url = bofuUrl(p.template, p.slug, p.city);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium">{p.title}</td>
                    <td className="px-4 py-2 text-sm text-muted-foreground">{p.template}{p.city ? ` · ${p.city}` : ""}</td>
                    <td className="px-4 py-2"><code className="text-xs">{url}</code></td>
                    <td className="px-4 py-2"><span className={`rounded px-2 py-0.5 text-xs ${p.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{p.status}</span></td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        {p.status === "published" && <a href={url} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button></a>}
                        <Button size="sm" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
