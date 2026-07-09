import { useState } from "react";
import { Search, LayoutTemplate, Sparkles, Video, TrendingUp } from "lucide-react";
import { DiscoveryPanel } from "./DiscoveryPanel";
import { TemplatesPanel } from "./TemplatesPanel";
import { PageBuilderPanel } from "./PageBuilderPanel";
import { VideoLibraryPanel } from "./VideoLibraryPanel";
import { RankingsPanel } from "./RankingsPanel";

type Tab = "discovery" | "templates" | "builder" | "videos" | "rankings";

const tabs: { id: Tab; label: string; icon: typeof Search }[] = [
  { id: "discovery", label: "Keyword Discovery", icon: Search },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "builder", label: "Page Builder", icon: Sparkles },
  { id: "videos", label: "Video Library", icon: Video },
  { id: "rankings", label: "Rankings", icon: TrendingUp },
];

export function BofuHub() {
  const [tab, setTab] = useState<Tab>("builder");
  const [seedKeyword, setSeedKeyword] = useState<string>("");

  const jumpToBuilder = (kw: string) => { setSeedKeyword(kw); setTab("builder"); };

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold text-foreground">BOFU Ranker — Bottom-of-Funnel Content Engine</p>
        <p className="mt-1 text-muted-foreground">
          Programmatic AI-generated pages targeting high-intent, low-competition queries: <code>/vs/</code>, <code>/alternatives/</code>, <code>/best/</code>, <code>/local/</code>. Each page ships with schema, FAQ, and short-form video embed for fast Page 1 rankings.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "discovery" && <DiscoveryPanel onGeneratePage={jumpToBuilder} />}
        {tab === "templates" && <TemplatesPanel />}
        {tab === "builder" && <PageBuilderPanel initialKeyword={seedKeyword} />}
        {tab === "videos" && <VideoLibraryPanel />}
        {tab === "rankings" && <RankingsPanel />}
      </div>
    </div>
  );
}
