import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, FileText, Save } from "lucide-react";
import { navigate } from "@/lib/static-router";
import { slugify } from "@/lib/slugify";

type Draft = {
  title: string;
  meta_description: string;
  slug: string;
  excerpt: string;
  content: string; // HTML
};

const TONES = ["Professional", "Friendly", "Conversational", "Expert / Technical", "Sales-oriented"];

export function AiGeneratorPanel() {
  const [form, setForm] = useState({
    topic: "",
    keyword: "",
    tone: "Friendly",
    wordCount: 900,
    audience: "South African resellers, print shops and small brand owners",
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    if (!form.topic.trim() || !form.keyword.trim()) {
      toast.error("Topic and focus keyword are required");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-draft", {
        body: form,
      });
      if (error) throw error;
      const d = data as Draft;
      setDraft({
        ...d,
        slug: d.slug || slugify(d.title || form.topic),
      });
      toast.success("Draft generated — edit and save when ready");
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
      const author_id = userData.user?.id;
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: draft.title,
          slug: draft.slug,
          excerpt: draft.excerpt,
          content: draft.content,
          meta_title: draft.title,
          meta_description: draft.meta_description,
          keywords: form.keyword,
          status: "draft",
          author_id,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Draft saved");
      navigate(`/admin/posts/${data.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold">Generate blog draft</h3>
        <div>
          <label className="text-xs font-medium">Topic *</label>
          <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="e.g. How to prepare artwork for DTF printing" />
        </div>
        <div>
          <label className="text-xs font-medium">Focus keyword *</label>
          <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="DTF artwork preparation" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Tone of voice</label>
            <select
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
            >
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Target word count</label>
            <Input type="number" value={form.wordCount} min={400} max={3000} step={100} onChange={(e) => setForm({ ...form, wordCount: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">Target audience</label>
          <Input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
        </div>
        <Button onClick={generate} disabled={busy} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          {busy ? "Generating (takes ~20-40s)…" : "Generate draft"}
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Draft preview
          </h3>
          {draft && (
            <Button size="sm" onClick={saveDraft} disabled={saving}>
              <Save className="mr-1 h-4 w-4" />
              {saving ? "Saving…" : "Save as draft"}
            </Button>
          )}
        </div>

        {!draft && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Fill in the form and click Generate. The AI will return a title, meta description, and article body you can edit here before saving to your blog.
          </p>
        )}

        {draft && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium">Title</label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Slug</label>
              <Input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Meta description ({draft.meta_description.length}/160)</label>
              <Textarea rows={2} value={draft.meta_description} onChange={(e) => setDraft({ ...draft, meta_description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Excerpt</label>
              <Textarea rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium">Article HTML</label>
              <Textarea
                rows={16}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                className="font-mono text-xs"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                After saving, open the post to edit visually in the rich text editor and add images.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
