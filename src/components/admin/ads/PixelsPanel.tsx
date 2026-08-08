import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, ExternalLink } from "lucide-react";

type Pixel = { id: string; network: string; pixel_id: string | null; enabled: boolean; extra: Record<string, string> | null };

const NETWORK_META: Record<string, { name: string; placeholder: string; help: string; docsUrl: string; extra?: { key: string; label: string; placeholder: string }[] }> = {
  meta: {
    name: "Meta Pixel (Facebook / Instagram)",
    placeholder: "e.g. 1234567890123456",
    help: "Find your Pixel ID in Meta Events Manager → Data Sources.",
    docsUrl: "https://business.facebook.com/events_manager",
  },
  tiktok: {
    name: "TikTok Pixel",
    placeholder: "e.g. C4ABCDEF12345GHIJKLM",
    help: "TikTok Ads Manager → Assets → Events → Web Events → Pixel ID.",
    docsUrl: "https://ads.tiktok.com/i18n/events_manager",
  },
  google: {
    name: "Google Ads / GA4",
    placeholder: "Google Ads ID: AW-123456789",
    help: "Google Ads → Tools → Conversions. Add your numeric GA4 Property ID (Admin → Property Settings) for dashboard stats.",
    docsUrl: "https://ads.google.com/",
    extra: [{ key: "ga4_id", label: "GA4 Property ID (numeric)", placeholder: "e.g. 123456789" }],
  },
  pinterest: {
    name: "Pinterest Tag",
    placeholder: "e.g. 2612345678901",
    help: "Pinterest Ads → Conversions → Install the Pinterest tag → Tag ID.",
    docsUrl: "https://ads.pinterest.com/",
  },
  bing: {
    name: "Microsoft / Bing UET Tag",
    placeholder: "e.g. 12345678",
    help: "Microsoft Advertising → Tools → UET tag → Tag ID.",
    docsUrl: "https://ads.microsoft.com/",
  },
};

export function PixelsPanel() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("ad_pixels").select("*").order("network");
    setPixels((data as Pixel[]) ?? []);
    setLoading(false);
  }

  async function save(p: Pixel) {
    const { error } = await supabase
      .from("ad_pixels")
      .update({ pixel_id: p.pixel_id, enabled: p.enabled, extra: p.extra ?? {} })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success(`${NETWORK_META[p.network].name} saved`);
  }

  function update(id: string, patch: Partial<Pixel>) {
    setPixels((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading pixels…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">How pixel tracking works</p>
        <p className="mt-1 text-muted-foreground">
          Paste each network's Pixel ID below and toggle it on. The tag loads on every page and fires <code>PageView</code>, <code>AddToCart</code>, <code>InitiateCheckout</code>, and (via UTM attribution) <code>Purchase</code> events automatically. For Shopify checkout completion events, also paste the same Pixel ID into Shopify → Settings → Customer events.
        </p>
      </div>

      {pixels.map((p) => {
        const meta = NETWORK_META[p.network];
        if (!meta) return null;
        return (
          <div key={p.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{meta.name}</h3>
                  {p.enabled && p.pixel_id && (
                    <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle2 className="h-3 w-3" /> Live
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{meta.help}</p>
              </div>
              <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Open manager <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <Label className="text-xs">Pixel ID</Label>
                <Input
                  value={p.pixel_id ?? ""}
                  onChange={(e) => update(p.id, { pixel_id: e.target.value })}
                  placeholder={meta.placeholder}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch checked={p.enabled} onCheckedChange={(v) => update(p.id, { enabled: v })} />
                  <span className="text-xs">Enabled</span>
                </div>
              </div>
            </div>
            {meta.extra?.map((ex) => (
              <div key={ex.key} className="mt-3">
                <Label className="text-xs">{ex.label}</Label>
                <Input
                  value={p.extra?.[ex.key] ?? ""}
                  onChange={(e) => update(p.id, { extra: { ...(p.extra ?? {}), [ex.key]: e.target.value } })}
                  placeholder={ex.placeholder}
                />
              </div>
            ))}
            <div className="mt-3">
              <Button size="sm" onClick={() => save(p)}>Save</Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
