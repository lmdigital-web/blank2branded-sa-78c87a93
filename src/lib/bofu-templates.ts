export type BofuTemplate = "versus" | "alternatives" | "best" | "local";

export const TEMPLATE_META: Record<BofuTemplate, { label: string; prefix: string; describe: string }> = {
  versus:       { label: "Versus",       prefix: "/vs",           describe: "Compare Blank2Branded to a competitor (blank2branded vs X)." },
  alternatives: { label: "Alternatives", prefix: "/alternatives", describe: "List alternatives to a competitor brand." },
  best:         { label: "Best-of",      prefix: "/best",         describe: "Best X in South Africa / for a use case." },
  local:        { label: "Local",        prefix: "/local",        describe: "City-targeted landing page (e.g. best DTF prints in Cape Town)." },
};

export function isNationalCity(city?: string | null): boolean {
  return !!city && city.trim().toLowerCase() === "south africa";
}

export function bofuUrl(template: BofuTemplate, slug: string, city?: string | null): string {
  if (template === "local") {
    if (isNationalCity(city)) return `/${slug}/`;
    const c = (city || "").toLowerCase().replace(/\s+/g, "-");
    return `/local/${c}/${slug}/`;
  }
  return `${TEMPLATE_META[template].prefix}/${slug}/`;
}

export function detectVideoPlatform(url: string): { platform: string; embedHtml: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return {
      platform: "youtube",
      embedHtml: `<iframe src="https://www.youtube.com/embed/${yt[1]}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" class="aspect-video w-full rounded-lg"></iframe>`,
    };
  }
  const tt = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
  if (tt) {
    return {
      platform: "tiktok",
      embedHtml: `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${tt[1]}"><a href="${url}">Watch on TikTok</a></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`,
    };
  }
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/);
  if (ig) {
    return {
      platform: "instagram",
      embedHtml: `<iframe src="https://www.instagram.com/reel/${ig[1]}/embed" frameborder="0" scrolling="no" allowtransparency="true" class="aspect-[9/16] w-full rounded-lg max-w-md mx-auto"></iframe>`,
    };
  }
  return null;
}

export function buildJsonLd(page: {
  template: BofuTemplate;
  title: string;
  meta_description: string | null;
  slug: string;
  city: string | null;
  faq_json: unknown;
  video_url: string | null;
}, siteUrl: string): object[] {
  const url = `${siteUrl}${bofuUrl(page.template, page.slug, page.city)}`;
  const out: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.meta_description || "",
      url,
    },
  ];
  const faq = Array.isArray(page.faq_json) ? (page.faq_json as { q: string; a: string }[]) : [];
  if (faq.length > 0) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  if (page.video_url) {
    out.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: page.title,
      description: page.meta_description || page.title,
      contentUrl: page.video_url,
      embedUrl: page.video_url,
      uploadDate: new Date().toISOString(),
    });
  }
  return out;
}

export const DEFAULT_CITIES = ["Johannesburg", "Pretoria", "Cape Town", "Durban", "Port Elizabeth", "Bloemfontein", "Mbombela"];
