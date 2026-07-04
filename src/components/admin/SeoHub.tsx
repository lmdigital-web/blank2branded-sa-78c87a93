import { useState } from "react";
import { Gauge, FileEdit, KeyRound, Sparkles, Link2, BarChart3 } from "lucide-react";
import { HealthAuditPanel } from "./seo/HealthAuditPanel";
import { MetaEditorPanel } from "./seo/MetaEditorPanel";
import { KeywordsPanel } from "./seo/KeywordsPanel";
import { AiGeneratorPanel } from "./seo/AiGeneratorPanel";
import { InternalLinksPanel } from "./seo/InternalLinksPanel";
import { AnalyticsPanel } from "./seo/AnalyticsPanel";

type Tab =
  | "health"
  | "meta"
  | "keywords"
  | "ai"
  | "internal"
  | "analytics";

const tabs: { id: Tab; label: string; icon: typeof Gauge; desc: string }[] = [
  { id: "health", label: "Health Audit", icon: Gauge, desc: "Per-page SEO score & prioritized fixes" },
  { id: "meta", label: "Meta Editor", icon: FileEdit, desc: "Titles, descriptions, canonicals, OG images" },
  { id: "keywords", label: "Keywords & Ideas", icon: KeyRound, desc: "Target-keyword tracker per page" },
  { id: "ai", label: "AI Content", icon: Sparkles, desc: "Generate blog drafts with AI" },
  { id: "internal", label: "Internal Links", icon: Link2, desc: "Suggest related pages to link" },
  { id: "analytics", label: "Analytics", icon: BarChart3, desc: "GSC clicks, impressions, ranking decay" },
];

export function SeoHub() {
  const [tab, setTab] = useState<Tab>("health");
  const [metaSearch, setMetaSearch] = useState("");

  const goFixMeta = (search: string) => {
    setMetaSearch(search);
    setTab("meta");
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title={t.desc}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tab === "health" && <HealthAuditPanel onFixMeta={goFixMeta} />}
        {tab === "meta" && <MetaEditorPanel initialSearch={metaSearch} />}
        {tab === "keywords" && <KeywordsPanel />}
        {tab === "ai" && <AiGeneratorPanel />}
        {tab === "internal" && <InternalLinksPanel />}
        {tab === "analytics" && <AnalyticsPanel />}
      </div>
    </div>
  );
}
