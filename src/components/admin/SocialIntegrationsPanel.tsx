import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Share2, Save, Loader2, Send } from "lucide-react";

export function SocialIntegrationsPanel() {
  const [url, setUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("social_webhook_url,auto_post_facebook_enabled")
      .eq("id", "default")
      .maybeSingle()
      .then(({ data }) => {
        setUrl(data?.social_webhook_url || "");
        setEnabled(!!data?.auto_post_facebook_enabled);
        setLoading(false);
      });
  }, []);

  async function onSave() {
    if (url.trim()) {
      try { new URL(url.trim()); } catch { return toast.error("Enter a valid URL"); }
    }
    setSaving(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({
        id: "default",
        social_webhook_url: url.trim() || null,
        auto_post_facebook_enabled: enabled,
      });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Social media settings saved");
  }

  async function onTest() {
    const target = url.trim();
    if (!target) return toast.error("Save a webhook URL first");
    try { new URL(target); } catch { return toast.error("Invalid URL"); }
    setTesting(true);
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test ping from Blank2Branded",
          url: "https://blank2branded.co.za/blog/test-ping",
          excerpt: "This is a test payload to verify your Make.com scenario receives data.",
          featured_image: "https://blank2branded.co.za/og-image.jpg",
          test: true,
        }),
      });
      if (res.ok) toast.success(`Test ping sent (HTTP ${res.status})`);
      else toast.error(`Receiver returned HTTP ${res.status}`);
    } catch (e) {
      toast.error(`Test failed: ${(e as Error).message}`);
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="rounded-lg border border-border bg-card p-6">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Social Media Integrations</h2>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Connect an automation platform like Make.com or Zapier to auto-post new
          blogs to Facebook and other channels when they go live.
        </p>

        <div className="space-y-5">
          <div>
            <Label htmlFor="webhook-url">Outgoing Blog Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://hook.eu1.make.com/abcdef..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-2"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Receives a JSON POST with <code>title</code>, <code>url</code>,
              <code> excerpt</code>, and <code>featured_image</code>.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-md border border-border bg-muted/40 p-4">
            <div>
              <Label htmlFor="auto-fb" className="text-sm font-semibold">
                Enable Auto-Post to Facebook on Publish
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                When ON, the webhook fires automatically each time a post moves
                to Published.
              </p>
            </div>
            <Switch id="auto-fb" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onTest} disabled={testing || !url.trim()}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send test ping
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
