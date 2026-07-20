import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Campaign = { id: string; name: string; network: string; creative_url: string | null; ad_copy: string | null; target_url: string | null };

export function CreativesPanel() {
  const [items, setItems] = useState<Campaign[]>([]);
  useEffect(() => {
    void supabase.from("ad_campaigns").select("id,name,network,creative_url,ad_copy,target_url").then(({ data }) => {
      setItems((data as Campaign[]) ?? []);
    });
  }, []);

  const withCreative = items.filter((i) => i.creative_url);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">Creative library</p>
        <p className="mt-1 text-muted-foreground">Every campaign's creative and copy in one place — perfect for reviewing what's live, remixing winners, and briefing designers. Add a Creative URL to any campaign to see it here.</p>
      </div>

      {withCreative.length === 0 && <p className="text-sm text-muted-foreground">No creatives yet. Add a Creative URL to a campaign to preview it here.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withCreative.map((c) => (
          <div key={c.id} className="overflow-hidden rounded-lg border border-border bg-card">
            {c.creative_url && (
              c.creative_url.match(/\.(mp4|webm|mov)$/i)
                ? <video src={c.creative_url} controls className="aspect-square w-full object-cover" />
                : <img src={c.creative_url} alt={c.name} className="aspect-square w-full object-cover" loading="lazy" />
            )}
            <div className="p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{c.network}</div>
              <div className="font-semibold">{c.name}</div>
              {c.ad_copy && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.ad_copy}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
