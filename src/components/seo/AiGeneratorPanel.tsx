import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, FileText, Save, ExternalLink, CheckCircle2, CircleAlert } from "lucide-react";
import { navigate } from "@/lib/static-router";
import { slugify } from "@/lib/slugify";
import { computeSeoScore, seoBadge } from "@/lib/seo-score";

type Product = { id: string; title: string; handle: string; status: string; base_price: number | null };
type InternalLink = { label: string; url: string; reason: string };

type Draft = {
  title: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  excerpt: string;
  content: string;
  primary_keyword: string;
  secondary_keywords: string[];
  search_intent: string;
  suggested_tags: string[];
  internal_links: InternalLink[];
  featured_image_prompt: string;
  featured_image_alt: string;
  faq: { question: string; answer: string }[];
};

const TONES = ["Professional", "Friendly", "Conversational", "Expert / Technical", "Sales-oriented"];
const INTENTS = ["Informational", "Commercial investigation", "Transactional", "Local / South African"];

function wordCount(html: string) {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

export function AiGeneratorPanel() {
  const [form, setForm] = useState({
    topic: "",
    keyword: "",
    tone: "Friendly",
    wordCount: 1200,
    audience: "South African resellers, print shops and small business owners",
    intent: "Informational",
    includeFaq: true,
    includeProducts: true,
    includeInternalLinks: true,
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadProductSuggestions(topic: string, keyword: string) {
    const { data } = await supabase
      .from("shop_products")
      .select("id,title,handle,status,base_price")
      .eq("status", "published")
      .limit(1000);
    const rows = (data as Product[]) ?? [];
    const terms = `${topic} ${keyword}`.toLowerCase().split(/[^a-z0-9]+/).filter((x) => x.length >= 4);
    const scored = rows
      .map((p) => ({ p, score: terms.reduce((n, t) => n + (p.title.toLowerCase().includes(t) ? 1 : 0), 0) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.p);
    setProducts(scored);
  }

  async function generate() {
    if (!form.topic.trim() || !form.keyword.trim()) {
      toast.error("Topic and focus keyword are required");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-draft", { body: form });
      if (error) throw error;
      const d = data as Draft;
      setDraft({
        ...d,
        slug: d.slug || slugify(d.title || form.topic),
        meta_title: d.meta_title || d.title || "",
        secondary_keywords: d.secondary_keywords || [],
        suggested_tags: d.suggested_tags || [],
        internal_links: d.internal_links || [],
        faq: d.faq || [],
      });
      if (form.includeProducts) void loadProductSuggestions(form.topic, form.keyword);
      toast.success("SEO draft generated — review it before publishing");
    } catch (e) {
      toast.error((e as Error).message || "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("posts").insert({
        title: draft.title.trim(),
        slug: slugify(draft.slug),
        excerpt: draft.excerpt.trim() || null,
        content: draft.content,
        meta_title: draft.meta_title.trim() || draft.title.trim(),
        meta_description: draft.meta_description.trim() || null,
        keywords: [draft.primary_keyword, ...draft.secondary_keywords].filter(Boolean).join(", "),
        status: "draft",
        created_by: userData.user?.id ?? null,
      }).select("id").single();
      if (error) throw error;
      toast.success("Draft saved");
      navigate(`/admin/posts/${data.id}`);
    } catch (e) {
      toast.error((e as Error).message || "Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  const seo = useMemo(() => draft ? computeSeoScore({
    title: draft.title,
    slug: draft.slug,
    excerpt: draft.excerpt,
    content: draft.content,
    cover_image_url: "",
    meta_title: draft.meta_title,
    meta_description: draft.meta_description,
    keywords: [draft.primary_keyword, ...draft.secondary_keywords].filter(Boolean).join(", "),
  }) : null, [draft]);

  const badge = seo ? seoBadge(seo.score) : null;
  const failing = seo?.checks.filter((c) => !c.pass).slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2"><Sparkles className="h-5 w-5 text-primary" /></div>
          <div>
            <h3 className="font-semibold">AI SEO Blog Studio</h3>
            <p className="text-sm text-muted-foreground">Give it a keyword and topic. It creates a structured, South Africa-focused SEO draft ready for your editor.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="text-xs font-medium">Primary keyword *</label><Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="e.g. blank t-shirts South Africa" /></div>
          <div><label className="text-xs font-medium">Article topic *</label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. How to choose blank t-shirts for your clothing brand" /></div>
          <div><label className="text-xs font-medium">Search intent</label><select className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.intent} onChange={(e) => setForm({ ...form, intent: e.target.value })}>{INTENTS.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className="text-xs font-medium">Tone</label><select className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>{TONES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label className="text-xs font-medium">Target audience</label><Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} /></div>
          <div><label className="text-xs font-medium">Target word count</label><Input type="number" min={900} max={3000} step={100} value={form.wordCount} onChange={(e) => setForm({ ...form, wordCount: Number(e.target.value) || 1200 })} /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.includeFaq} onChange={(e) => setForm({ ...form, includeFaq: e.target.checked })} /> Include FAQ</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.includeInternalLinks} onChange={(e) => setForm({ ...form, includeInternalLinks: e.target.checked })} /> Suggest internal links</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.includeProducts} onChange={(e) => setForm({ ...form, includeProducts: e.target.checked })} /> Suggest shop products</label>
        </div>
        <Button className="mt-5 w-full md:w-auto" onClick={generate} disabled={busy}><Sparkles className="mr-2 h-4 w-4" />{busy ? "Writing SEO article…" : draft ? "Regenerate article" : "Generate SEO article"}</Button>
      </div>

      {draft && (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" />Generated article</h3><Button onClick={saveDraft} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save as draft & open editor"}</Button></div>
            <div><label className="text-xs font-medium">SEO title</label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">{draft.title.length} characters</p></div>
            <div><label className="text-xs font-medium">Meta title</label><Input value={draft.meta_title} onChange={(e) => setDraft({ ...draft, meta_title: e.target.value })} /></div>
            <div><label className="text-xs font-medium">Slug</label><Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></div>
            <div><label className="text-xs font-medium">Meta description</label><Textarea rows={3} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} /><p className="mt-1 text-xs text-muted-foreground">{draft.meta_description.length}/160</p></div>
            <div><label className="text-xs font-medium">Excerpt</label><Textarea rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></div>
            <div><label className="text-xs font-medium">Article HTML</label><Textarea rows={22} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="font-mono text-xs" /></div>
            {draft.faq.length > 0 && <div><label className="text-xs font-medium">FAQ generated</label><div className="mt-2 space-y-2">{draft.faq.map((f, i) => <div key={i} className="rounded-md bg-muted/50 p-3 text-sm"><strong>{f.question}</strong><p className="mt-1 text-muted-foreground">{f.answer}</p></div>)}</div></div>}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between"><h4 className="font-semibold">SEO readiness</h4>{badge && <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.color}`}>{seo?.score}/100 {badge.label}</span>}</div>
              <p className="mt-2 text-xs text-muted-foreground">{wordCount(draft.content)} words • {draft.primary_keyword}</p>
              <div className="mt-3 space-y-2">{seo?.checks.slice(0, 10).map((c) => <div key={c.id} className="flex gap-2 text-xs">{c.pass ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-600" />}<span>{c.label}</span></div>)}</div>
              {failing.length > 0 && <div className="mt-3 rounded-md bg-amber-500/10 p-3 text-xs"><strong>Fix before publishing:</strong><ul className="mt-1 list-disc pl-4">{failing.map((c) => <li key={c.id}>{c.hint}</li>)}</ul></div>}
            </div>
            <div className="rounded-lg border border-border bg-card p-4"><h4 className="font-semibold">Keywords & tags</h4><p className="mt-2 text-xs"><strong>Primary:</strong> {draft.primary_keyword}</p><p className="mt-2 text-xs"><strong>Related:</strong> {draft.secondary_keywords.join(", ") || "—"}</p><p className="mt-2 text-xs"><strong>Tags:</strong> {draft.suggested_tags.join(", ") || "—"}</p></div>
            {draft.internal_links.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><h4 className="font-semibold">Internal link suggestions</h4><div className="mt-2 space-y-2">{draft.internal_links.map((l, i) => <a key={i} href={l.url} target="_blank" rel="noreferrer" className="block rounded-md border p-2 text-xs hover:bg-muted"><span className="font-medium">{l.label}</span><span className="ml-1 text-muted-foreground">{l.reason}</span><ExternalLink className="ml-1 inline h-3 w-3" /></a>)}</div></div>}
            {products.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><h4 className="font-semibold">Relevant shop products</h4><p className="mt-1 text-xs text-muted-foreground">Real products from your catalogue that could be linked naturally.</p><div className="mt-2 space-y-2">{products.map((p) => <a key={p.id} href={`/products/${p.handle}`} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md border p-2 text-xs hover:bg-muted"><span>{p.title}</span><ExternalLink className="h-3 w-3 shrink-0" /></a>)}</div></div>}
            <div className="rounded-lg border border-border bg-card p-4"><h4 className="font-semibold">Featured image</h4><p className="mt-2 text-xs text-muted-foreground">{draft.featured_image_prompt}</p><p className="mt-2 text-xs"><strong>Alt:</strong> {draft.featured_image_alt}</p><p className="mt-3 text-xs text-muted-foreground">Use the existing AI Image button in the editor to generate the image after saving.</p></div>
          </aside>
        </div>
      )}

      {!draft && <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">Enter a keyword and topic above. The generator will create the article, SEO metadata, FAQs and linking suggestions.</div>}
    </div>
  );
}
