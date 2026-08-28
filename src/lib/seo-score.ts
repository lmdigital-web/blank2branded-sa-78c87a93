// Yoast-style SEO scoring for blog posts.
// Each check has a weight; the score is (sum of passing weights) / (total weight) * 100.

export type SeoCheck = {
  id: string;
  label: string;
  pass: boolean;
  weight: number;
  hint: string;
};

export type SeoInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // HTML
  cover_image_url: string;
  meta_title: string;
  meta_description: string;
  keywords: string; // comma separated

  // E-E-A-T signals
  author_name?: string | null;
  author_credentials?: string | null;
  experience_notes?: string | null;
};

function stripHtml(html: string) {
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ");
  }

  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  return tmp.textContent || tmp.innerText || "";
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function lower(s: string) {
  return (s || "").toLowerCase();
}

/**
 * Escape a string so it can safely be used inside a RegExp.
 */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function computeSeoScore(input: SeoInput) {
  const focus = (input.keywords.split(",")[0] || "").trim().toLowerCase();

  const text = stripHtml(input.content || "");
  const words = countWords(text);
  const html = input.content || "";

  // Content structure
  const h2Count = (html.match(/<h2(\s|>)/gi) || []).length;
  const h3Count = (html.match(/<h3(\s|>)/gi) || []).length;

  // Images
  const imgCount = (html.match(/<img\b/gi) || []).length;

  const imgsMissingAlt =
    (
      html.match(
        /<img\b(?![^>]*\balt\s*=\s*(["'])?[^>]*\1?)[^>]*>/gi
      ) || []
    ).length;

  // Links
  const linkCount =
    (html.match(/<a\b[^>]*\bhref\s*=/gi) || []).length;

  const internalLinks =
    (
      html.match(
        /<a\b[^>]*\bhref\s*=\s*["'](?:\/|https?:\/\/(?:www\.)?blank2branded\.co\.za)/gi
      ) || []
    ).length;

  const externalLinks = Math.max(0, linkCount - internalLinks);

  // First paragraph
  const firstParaMatch = html.match(
    /<p[^>]*>([\s\S]*?)<\/p>/i
  );

  const firstParaText = firstParaMatch
    ? lower(stripHtml(firstParaMatch[1]))
    : "";

  // Keyword placement
  const focusInTitle = focus
    ? lower(input.title).includes(focus)
    : false;

  const focusInMetaTitle = focus
    ? lower(input.meta_title).includes(focus)
    : false;

  const focusInMetaDesc = focus
    ? lower(input.meta_description).includes(focus)
    : false;

  const focusInSlug = focus
    ? lower(input.slug).includes(focus.replace(/\s+/g, "-")) ||
      lower(input.slug).split("-").join(" ").includes(focus)
    : false;

  const focusInFirstPara = focus
    ? firstParaText.includes(focus)
    : false;

  const focusInContent = focus
    ? lower(text).includes(focus)
    : false;

  // Keyword density
  // Target: 0.5%–2.5%
  let density = 0;

  if (focus && words > 0) {
    const escaped = escapeRegExp(focus);

    const matches =
      lower(text).match(
        new RegExp(`\\b${escaped}\\b`, "g")
      ) || [];

    density = (matches.length / words) * 100;
  }

  const densityOk =
    density >= 0.5 && density <= 2.5;

  const checks: SeoCheck[] = [
    {
      id: "focus",
      label: "Focus keyword set",
      pass: !!focus,
      weight: 5,
      hint: "Add at least one focus keyword in the SEO panel.",
    },

    {
      id: "title-len",
      label: "Title length 40–70 chars",
      pass:
        input.title.length >= 40 &&
        input.title.length <= 70,
      weight: 4,
      hint: `Current title is ${input.title.length} chars. Aim for 40–70.`,
    },

    {
      id: "focus-title",
      label: "Focus keyword in post title",
      pass: focusInTitle,
      weight: 6,
      hint: "Work your focus keyword into the post title naturally.",
    },

    {
      id: "slug",
      label: "URL slug present & contains focus keyword",
      pass:
        !!input.slug &&
        (focus ? focusInSlug : true),
      weight: 4,
      hint: "Include the focus keyword in the URL slug.",
    },

    {
      id: "meta-title",
      label: "Meta title 30–60 chars",
      pass:
        input.meta_title.length >= 30 &&
        input.meta_title.length <= 60,
      weight: 5,
      hint: `Meta title is ${input.meta_title.length} chars. Aim for 30–60.`,
    },

    {
      id: "focus-meta-title",
      label: "Focus keyword in meta title",
      pass: focusInMetaTitle,
      weight: 4,
      hint: "Add the focus keyword to the meta title.",
    },

    {
      id: "meta-desc",
      label: "Meta description 120–160 chars",
      pass:
        input.meta_description.length >= 120 &&
        input.meta_description.length <= 160,
      weight: 5,
      hint: `Meta description is ${input.meta_description.length} chars. Aim for 120–160.`,
    },

    {
      id: "focus-meta-desc",
      label: "Focus keyword in meta description",
      pass: focusInMetaDesc,
      weight: 4,
      hint: "Mention the focus keyword in the meta description.",
    },

    {
      id: "excerpt",
      label: "Excerpt provided",
      pass: input.excerpt.trim().length >= 50,
      weight: 3,
      hint: "Write an excerpt of at least 50 characters for the blog list page.",
    },

    {
      id: "cover",
      label: "Featured image set",
      pass: !!input.cover_image_url,
      weight: 4,
      hint: "Add a featured/cover image URL.",
    },

    {
      id: "word-count",
      label: "Content ≥ 600 words",
      pass: words >= 600,
      weight: 6,
      hint: `Currently ${words} words. Aim for 600+ for solid SEO.`,
    },

    {
      id: "long-form",
      label: "Content ≥ 900 words",
      pass: words >= 900,
      weight: 3,
      hint: "900+ words can provide enough depth for competitive topics.",
    },

    {
      id: "h2",
      label: "At least 2 H2 subheadings",
      pass: h2Count >= 2,
      weight: 5,
      hint: `Currently ${h2Count} H2 headings. Add more for structure.`,
    },

    {
      id: "h3",
      label: "At least 1 H3 subheading",
      pass: h3Count >= 1,
      weight: 2,
      hint: "Use H3s under your H2s to nest sub-topics.",
    },

    {
      id: "focus-first-para",
      label: "Focus keyword in first paragraph",
      pass: focusInFirstPara,
      weight: 5,
      hint: "Mention the focus keyword naturally in the first paragraph.",
    },

    {
      id: "focus-body",
      label: "Focus keyword in body",
      pass: focusInContent,
      weight: 4,
      hint: "Use the focus keyword naturally throughout the body.",
    },

    {
      id: "density",
      label: "Keyword density 0.5–2.5%",
      pass: densityOk,
      weight: 4,
      hint: `Density is ${density.toFixed(2)}%. Aim for 0.5–2.5%.`,
    },

    {
      id: "images",
      label: "At least 1 image in content",
      pass: imgCount >= 1,
      weight: 3,
      hint: "Add at least one image inside the article.",
    },

    {
      id: "alt",
      label: "All content images have alt text",
      pass:
        imgCount === 0
          ? true
          : imgsMissingAlt === 0,
      weight: 4,
      hint: `${imgsMissingAlt} image(s) missing alt text.`,
    },

    {
      id: "internal",
      label: "At least 1 internal link",
      pass: internalLinks >= 1,
      weight: 4,
      hint: "Link to /shop, /dtf, /blanks, /catalogues or a related blog.",
    },

    {
      id: "external",
      label: "At least 1 external link",
      pass: externalLinks >= 1,
      weight: 2,
      hint: "Cite an authoritative external source.",
    },

    {
      id: "eeat-author",
      label: "Author assigned with credentials",
      pass:
        !!input.author_name &&
        (input.author_credentials || "").trim().length >= 10,
      weight: 5,
      hint: "Assign an author with a professional bio or credentials.",
    },

    {
      id: "eeat-experience",
      label:
        "Information Gain / First-Hand Experience notes (≥80 chars)",
      pass:
        (input.experience_notes || "").trim().length >= 80,
      weight: 5,
      hint:
        "Add unique first-hand experience, case data, or insights Google can't find elsewhere.",
    },
  ];

  const total = checks.reduce(
    (sum, check) => sum + check.weight,
    0
  );

  const got = checks.reduce(
    (sum, check) =>
      sum + (check.pass ? check.weight : 0),
    0
  );

  const score = Math.round(
    (got / total) * 100
  );

  return {
    score,
    checks,
    words,
    density,
  };
}

export function seoBadge(score: number) {
  if (score >= 80) {
    return {
      label: "Good",
      color:
        "bg-green-100 text-green-800 border-green-200",
      bar: "bg-green-500",
    };
  }

  if (score >= 55) {
    return {
      label: "OK",
      color:
        "bg-amber-100 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "Needs work",
    color:
      "bg-red-100 text-red-800 border-red-200",
    bar: "bg-red-500",
  };
}