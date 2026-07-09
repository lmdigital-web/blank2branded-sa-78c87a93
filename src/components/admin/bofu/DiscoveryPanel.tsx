import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Sparkles, Loader2 } from "lucide-react";

type Row = {
  id?: string;
  keyword: string;
  intent: string | null;
  volume: number | null;
  difficulty: number | null;
  status?: string;
};

const INTENT_COLORS: Record<string, string> = {
  versus: "bg-purple-100 text-purple-800",
  alternatives: "bg-blue-100 text-blue-800",
  best: "bg-emerald-100 text-emerald-800",
  local: "bg-amber-100 text-amber-800",
  price: "bg-pink-100 text-pink-800",
  other: "bg-muted text-muted-foreground",
};

export function DiscoveryPanel({ onGeneratePage }: { onGeneratePage: (kw: string) => void }) {
  const [seed, setSeed] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    const { data } = await supabase.from("bofu_keywords").select("*").order("volume", { ascending: false, nullsFirst: false }).limit(200);
    setRows((data as Row[]) ?? []);
  }

  async function discover() {
    if (!seed.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("bofu-discover-keywords", { body: { seed } });
      if (error) throw error;
      toast.success(`Found ${data?.count ?? 0} BOFU keywords`);
      void load();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  async function dismiss(id: string) {
    await supabase.from("bofu_keywords").update({ status: "dismissed" }).eq("id", id);
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="Seed keyword (e.g. custom t-shirts, DTF prints)" className="pl-9" onKeyDown={(e) => e.key === "Enter" && discover()} />
          </div>
          <Button onClick={discover} disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Discover</Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Uses Semrush + AI to classify keywords into BOFU intent buckets (versus / alternatives / best / local / price).</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Discovered keywords ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-2">Keyword</th><th className="px-4 py-2">Intent</th><th className="px-4 py-2 text-right">Volume</th><th className="px-4 py-2 text-right">KD</th><th className="px-4 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No keywords yet — run Discover above.</td></tr>}
              {rows.filter((r) => r.status !== "dismissed").map((r) => (
                <tr key={r.id || r.keyword} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium">{r.keyword}</td>
                  <td className="px-4 py-2"><span className={`rounded px-2 py-0.5 text-xs ${INTENT_COLORS[r.intent || "other"]}`}>{r.intent || "other"}</span></td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.volume ?? "—"}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.difficulty ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => onGeneratePage(r.keyword)}>Generate page</Button>
                      {r.id && <Button size="sm" variant="ghost" onClick={() => dismiss(r.id!)}>Dismiss</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
