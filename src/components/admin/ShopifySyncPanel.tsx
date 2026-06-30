import { useState } from "react";
import { RevenuePanel } from "./RevenuePanel";
import { BrokenLinksPanel } from "./BrokenLinksPanel";
import { BarChart3, LinkIcon as LinkIco, HelpCircle } from "lucide-react";

type Tab = "revenue" | "links" | "help";

export function ShopifySyncPanel() {
  const [tab, setTab] = useState<Tab>("revenue");
  const webhookUrl =
    (import.meta.env.VITE_SUPABASE_URL ?? "https://your-backend") +
    "/functions/v1/shopify-order-webhook";

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        <TabBtn active={tab === "revenue"} onClick={() => setTab("revenue")} icon={<BarChart3 className="h-3.5 w-3.5" />}>
          Revenue
        </TabBtn>
        <TabBtn active={tab === "links"} onClick={() => setTab("links")} icon={<LinkIco className="h-3.5 w-3.5" />}>
          Link health
        </TabBtn>
        <TabBtn active={tab === "help"} onClick={() => setTab("help")} icon={<HelpCircle className="h-3.5 w-3.5" />}>
          Setup
        </TabBtn>
      </div>

      {tab === "revenue" && <RevenuePanel />}
      {tab === "links" && <BrokenLinksPanel />}
      {tab === "help" && (
        <div className="space-y-4 rounded-lg border border-border bg-card p-6 text-sm">
          <div>
            <h3 className="text-base font-semibold">Product card inserter</h3>
            <p className="text-muted-foreground">
              Open any blog post in the editor and click the <strong>"Product"</strong> button in the
              toolbar to browse live Shopify products and insert a card.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold">Click tracking</h3>
            <p className="text-muted-foreground">
              All outbound shop links inside published posts are automatically rewritten to{" "}
              <code>/r/blog/&lt;post-id&gt;/&lt;handle&gt;</code> for attribution.
            </p>
          </div>
          <div>
            <h3 className="text-base font-semibold">Order webhook (for revenue attribution)</h3>
            <p className="text-muted-foreground">
              In Shopify admin → Settings → Notifications → Webhooks, create an{" "}
              <strong>Order creation</strong> webhook (JSON) pointing to:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{webhookUrl}</pre>
            <p className="mt-2 text-muted-foreground">
              Then store the webhook signing secret in the backend as{" "}
              <code>SHOPIFY_WEBHOOK_SECRET</code>. Orders that originate from a tracked blog link
              automatically include <code>ref=blog-&lt;post-id&gt;</code> in the landing URL and
              will appear under Revenue.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon}
      {children}
    </button>
  );
}
