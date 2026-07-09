import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video } from "lucide-react";
import { bofuUrl, type BofuTemplate } from "@/lib/bofu-templates";

type Row = { id: string; title: string; slug: string; template: BofuTemplate; city: string | null; video_url: string | null; video_platform: string | null; status: string };

export function VideoLibraryPanel() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from("bofu_pages").select("id,title,slug,template,city,video_url,video_platform,status").order("updated_at", { ascending: false }).then(({ data }) => {
      setRows((data as Row[]) ?? []);
    });
  }, []);

  const withVideo = rows.filter((r) => r.video_url);
  const withoutVideo = rows.filter((r) => !r.video_url);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">Short-form video embeds (YouTube Shorts, TikTok, Instagram Reels) give BOFU pages a chance to appear in Google's video carousel. Add a video URL from the Page Builder.</p>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center gap-2">
          <Video className="h-4 w-4" /> With video ({withVideo.length})
        </div>
        {withVideo.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No pages have video yet.</p> : (
          <ul className="divide-y divide-border">
            {withVideo.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div><div className="font-medium">{r.title}</div><code className="text-xs text-muted-foreground">{bofuUrl(r.template, r.slug, r.city)}</code></div>
                <a href={r.video_url!} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">{r.video_platform}</a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Missing video ({withoutVideo.length})</div>
        {withoutVideo.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Every page has video 🎉</p> : (
          <ul className="divide-y divide-border">
            {withoutVideo.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div><div className="font-medium">{r.title}</div><code className="text-xs text-muted-foreground">{bofuUrl(r.template, r.slug, r.city)}</code></div>
                <span className="text-xs text-muted-foreground">No video</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
