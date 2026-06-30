import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Save, X, UserCircle2 } from "lucide-react";

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  credentials: string | null;
  avatar_url: string | null;
  email: string | null;
  website: string | null;
  social: Record<string, string> | null;
  expertise: string[] | null;
};

type Form = {
  id?: string;
  name: string;
  slug: string;
  bio: string;
  credentials: string;
  avatar_url: string;
  email: string;
  website: string;
  social_linkedin: string;
  social_twitter: string;
  social_facebook: string;
  expertise: string;
};

const empty: Form = {
  name: "", slug: "", bio: "", credentials: "", avatar_url: "", email: "", website: "",
  social_linkedin: "", social_twitter: "", social_facebook: "", expertise: "",
};

export function AuthorsPanel() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("authors").select("*").order("name");
    setAuthors((data as Author[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { void load(); }, []);

  function startNew() {
    setEditing({ ...empty });
  }
  function startEdit(a: Author) {
    setEditing({
      id: a.id,
      name: a.name,
      slug: a.slug,
      bio: a.bio ?? "",
      credentials: a.credentials ?? "",
      avatar_url: a.avatar_url ?? "",
      email: a.email ?? "",
      website: a.website ?? "",
      social_linkedin: a.social?.linkedin ?? "",
      social_twitter: a.social?.twitter ?? "",
      social_facebook: a.social?.facebook ?? "",
      expertise: (a.expertise ?? []).join(", "),
    });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name is required");
    const slug = slugify(editing.slug || editing.name);
    setSaving(true);
    const payload = {
      name: editing.name.trim(),
      slug,
      bio: editing.bio.trim() || null,
      credentials: editing.credentials.trim() || null,
      avatar_url: editing.avatar_url.trim() || null,
      email: editing.email.trim() || null,
      website: editing.website.trim() || null,
      social: {
        ...(editing.social_linkedin.trim() ? { linkedin: editing.social_linkedin.trim() } : {}),
        ...(editing.social_twitter.trim() ? { twitter: editing.social_twitter.trim() } : {}),
        ...(editing.social_facebook.trim() ? { facebook: editing.social_facebook.trim() } : {}),
      },
      expertise: editing.expertise.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const res = editing.id
      ? await supabase.from("authors").update(payload).eq("id", editing.id)
      : await supabase.from("authors").insert(payload);
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Author saved");
    setEditing(null);
    void load();
  }

  async function remove(a: Author) {
    if (!confirm(`Delete author "${a.name}"? Posts linked to them will be unassigned.`)) return;
    const { error } = await supabase.from("authors").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    toast.success("Author deleted");
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Authors</h2>
          <p className="text-sm text-muted-foreground">E-E-A-T author profiles. Linked to blog posts and exposed in JSON-LD.</p>
        </div>
        {!editing && <Button onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New author</Button>}
      </div>

      {editing && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editing.id ? "Edit author" : "New author"}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
              <Button size="sm" onClick={save} disabled={saving}><Save className="mr-1 h-4 w-4" /> Save</Button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Name *</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto-from-name" />
            </div>
            <div className="md:col-span-2">
              <Label>Bio</Label>
              <Textarea rows={3} value={editing.bio} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} placeholder="2–3 sentence professional bio that establishes expertise." />
            </div>
            <div className="md:col-span-2">
              <Label>Credentials / Job title</Label>
              <Input value={editing.credentials} onChange={(e) => setEditing({ ...editing, credentials: e.target.value })} placeholder="e.g. DTF Print Specialist, 8 years in apparel branding" />
            </div>
            <div>
              <Label>Avatar URL</Label>
              <Input value={editing.avatar_url} onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={editing.website} onChange={(e) => setEditing({ ...editing, website: e.target.value })} />
            </div>
            <div>
              <Label>Expertise (comma-separated)</Label>
              <Input value={editing.expertise} onChange={(e) => setEditing({ ...editing, expertise: e.target.value })} placeholder="DTF printing, apparel branding, screen printing" />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input value={editing.social_linkedin} onChange={(e) => setEditing({ ...editing, social_linkedin: e.target.value })} />
            </div>
            <div>
              <Label>Twitter / X</Label>
              <Input value={editing.social_twitter} onChange={(e) => setEditing({ ...editing, social_twitter: e.target.value })} />
            </div>
            <div>
              <Label>Facebook</Label>
              <Input value={editing.social_facebook} onChange={(e) => setEditing({ ...editing, social_facebook: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Credentials</th>
              <th className="px-4 py-3">Expertise</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : authors.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No authors yet.</td></tr>
            ) : authors.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {a.avatar_url
                      ? <img src={a.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                      : <UserCircle2 className="h-7 w-7 text-muted-foreground" />}
                    {a.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{a.credentials || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{(a.expertise ?? []).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(a)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
