import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Post title, used to auto-suggest a prompt */
  title?: string;
  /** Post content (HTML), used to auto-suggest a prompt */
  contentHtml?: string;
  /** Called with the uploaded image public URL when generation succeeds */
  onGenerated: (url: string) => void;
};

function suggestFrom(title?: string, contentHtml?: string): string {
  const t = (title || "").trim();
  let excerpt = "";
  if (contentHtml) {
    const tmp = document.createElement("div");
    tmp.innerHTML = contentHtml;
    excerpt = (tmp.textContent || "").replace(/\s+/g, " ").trim().slice(0, 220);
  }
  if (!t && !excerpt) return "";
  if (t && excerpt) return `Editorial hero image for a blog post titled "${t}". Context: ${excerpt}`;
  return t ? `Editorial hero image for a blog post titled "${t}".` : `Editorial hero image. Context: ${excerpt}`;
}

export function AiImageDialog({ open, onOpenChange, title, contentHtml, onGenerated }: Props) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setPrompt("");
  }, [open]);

  async function generate() {
    if (prompt.trim().length < 3) {
      toast.error("Add a short prompt first");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-image", {
        body: { prompt },
      });
      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error((data as any)?.error || "No image returned");
      onGenerated(data.url);
      toast.success("Image generated & inserted");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Generate image with AI
          </DialogTitle>
          <DialogDescription>
            Describe the image you want. Photorealistic product/lifestyle style is applied automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label htmlFor="ai-prompt">Prompt</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => {
                  const s = suggestFrom(title, contentHtml);
                  if (!s) {
                    toast.info("Add a title or some content first");
                    return;
                  }
                  setPrompt(s);
                }}
                disabled={busy}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Suggest from post
              </Button>
            </div>
            <Textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "A South African small-business owner wearing a branded custom t-shirt in a bright studio"'
              rows={5}
              disabled={busy}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Uses Lovable AI (billed to your workspace credits). Images are saved to your blog images bucket.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={generate} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
