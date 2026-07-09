import { TEMPLATE_META, DEFAULT_CITIES } from "@/lib/bofu-templates";

export function TemplatesPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.keys(TEMPLATE_META) as (keyof typeof TEMPLATE_META)[]).map((k) => {
        const t = TEMPLATE_META[k];
        return (
          <div key={k} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">{t.label}</h3>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{t.prefix}/{"{slug}"}</code>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{t.describe}</p>
            <div className="mt-4 text-xs text-muted-foreground">
              <div>Renders: H1 · intro · video embed · body · FAQ · shop/quote CTA</div>
              <div>Schema: WebPage + FAQPage {k === "local" && "+ LocalBusiness"} {k === "versus" && "+ Comparison"}</div>
            </div>
          </div>
        );
      })}
      <div className="rounded-lg border border-border bg-card p-5 md:col-span-2">
        <h3 className="text-lg font-semibold">Default cities (for /local/ pages)</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_CITIES.map((c) => (
            <span key={c} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs">{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
