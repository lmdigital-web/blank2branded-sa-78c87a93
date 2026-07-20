import { useState } from "react";
import { BarChart3, Target, Link2, Activity, Image as ImageIcon, Settings2 } from "lucide-react";
import { DashboardPanel } from "./DashboardPanel";
import { PixelsPanel } from "./PixelsPanel";
import { CampaignsPanel } from "./CampaignsPanel";
import { UtmBuilderPanel } from "./UtmBuilderPanel";
import { ConversionsPanel } from "./ConversionsPanel";
import { CreativesPanel } from "./CreativesPanel";

type Tab = "dashboard" | "pixels" | "campaigns" | "utm" | "conversions" | "creatives";

const TABS: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "pixels", label: "Pixels & Tags", icon: Settings2 },
  { id: "campaigns", label: "Campaigns", icon: Target },
  { id: "utm", label: "UTM Builder", icon: Link2 },
  { id: "conversions", label: "Conversions", icon: Activity },
  { id: "creatives", label: "Creatives", icon: ImageIcon },
];

export function AdsHub() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "dashboard" && <DashboardPanel />}
      {tab === "pixels" && <PixelsPanel />}
      {tab === "campaigns" && <CampaignsPanel />}
      {tab === "utm" && <UtmBuilderPanel />}
      {tab === "conversions" && <ConversionsPanel />}
      {tab === "creatives" && <CreativesPanel />}
    </div>
  );
}
