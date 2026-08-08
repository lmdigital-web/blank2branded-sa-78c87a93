import { SearchConsolePanel } from "@/components/admin/SearchConsolePanel";
import { DecayPanel } from "@/components/admin/DecayPanel";
import { OpportunitiesPanel } from "@/components/admin/OpportunitiesPanel";
import { SpeedPanel } from "@/components/admin/SpeedPanel";
import { IndexingPanel } from "@/components/admin/IndexingPanel";
import { TrafficPanel } from "@/components/admin/seo/TrafficPanel";
import { useState } from "react";

const subTabs = [
  { id: "traffic", label: "Traffic (GA4)" },
  { id: "gsc", label: "Search Console" },
  { id: "opportunities", label: "Opportunities" },
  { id: "decay", label: "Rankings at Risk" },
  { id: "speed", label: "Page Speed" },
  { id: "indexing", label: "Indexing" },
] as const;

export function AnalyticsPanel() {
  const [tab, setTab] = useState<(typeof subTabs)[number]["id"]>("traffic");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-2">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {tab === "traffic" && <TrafficPanel />}
        {tab === "gsc" && <SearchConsolePanel />}
        {tab === "opportunities" && <OpportunitiesPanel />}
        {tab === "decay" && <DecayPanel />}
        {tab === "speed" && <SpeedPanel />}
        {tab === "indexing" && <IndexingPanel />}
      </div>
    </div>
  );
}
