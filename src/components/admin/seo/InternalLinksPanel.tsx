import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Link2 } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  keywords: string | null;
  status: string;
};

const STATIC_PAGES: { path: string; title: string; keywords: string }[] = [
  { path: "/dtf", title: "DTF Transfers", keywords: "dtf, transfers, gang sheet, print, heat transfer, cotton, polyester" },
  { path: "/blanks", title: "Blank Apparel", keywords: "blanks, t-shirts, hoodies, golf shirts, wholesale, cotton" },
  { path: "/shop", title: "Shop", keywords: "shop, buy, order, online, dtf, blanks" },
  { path: "/sublimation", title: "Sublimation Printing", keywords: "sublimation, custom, jerseys, golf shirts, all-over print" },
  { path: "/display", title: "Display & Signage", keywords: "gazebo, banner, flag, signage, display, events" },
  { path: "/catalogues", title: "Catalogues", keywords: "catalogue, gifts, corporate, bags, drinkware" },
  { path: "/about", title: "About", keywords: "about, blank2branded, mbombela, south africa" },
  { path: "/contact", title: "Contact", keywords: "contact, quote, whatsapp, email" },
];

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,.\-_/]+/)
      .filter((t) => t.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

export function InternalLinksPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,slug,title,keywords,status")
        .order("updated_at", { ascending: false });
      setPosts((data as Post[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const selected = posts.find((p) => p.id === selectedId);

  const suggestions = useMemo(() => {
    if (!selected) return [];
    const src = tokenize(`${selected.title} ${selected.keywords ?? ""}`);
    const postCandidates = posts
      .filter((p) => p.id !== selected.id && p.status === "published")
      .map((p) => ({
        kind: "post" as const,
        path: `/blog/${p.slug}`,
        title: p.title,
        score: jaccard(src, tokenize(`${p.title} ${p.keywords ?? ""}`)),
      }));
    const pageCandidates = STATIC_PAGES.map((s) => ({
      kind: "page" as const,
      path: s.path,
      title: s.title,
      score: jaccard(src, tokenize(`${s.title} ${s.keywords}`)),
    }));
    return [...postCandidates, ...pageCandidates]
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [selected, posts]);

  async function copyLink(path: string, title: string) {
    const anchor = `<a href="${path}">${title}</a>`;
    await navigator.clipboard.writeText(anchor);
    toast.success("Anchor HTML copied to clipboard");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <label className="text-xs font-medium">Pick a post to find internal linking opportunities</label>
        <select
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">— Select a post —</option>
          {posts.map((p) => (
            <option key={p.id} value={p.id}>{p.title} ({p.status})</option>
          ))}
        </select>
      </div>

      {loading && <p className="p-6 text-center text-muted-foreground">Loading…</p>}

      {selected && suggestions.length === 0 && (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No obvious internal links found. Try adding more keywords to the source post first.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Suggested page</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Match</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {s.title}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.path}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${s.kind === "post" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                      {s.kind}
                    </span>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{Math.round(s.score * 100)}%</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => copyLink(s.path, s.title)}>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy link
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
