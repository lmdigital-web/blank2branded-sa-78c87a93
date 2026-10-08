/**
 * generate-insert-files.ts
 *
 * Generates JSON files for each post containing all fields needed
 * for the admin UI. The user can copy these into the admin panel.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

const DRAFTS_DIR = resolve("drafts");
const OUTPUT_DIR = resolve("drafts", "ready-to-import");
mkdirSync(OUTPUT_DIR, { recursive: true });

const BASE_URL = "https://blank2branded.co.za";
const PLACEHOLDER_IMAGE = `${BASE_URL}/og-default.png`;
const AUTHOR_ID = "443bded4-4701-4bba-a4fb-3f2686325263"; // Blank2Branded Team

const META: Record<string, { title: string; description: string }> = {
  "top-trends-matric-jackets-hoodies-nelspruit": {
    title: "Top Trends for Matric Jackets and Hoodies in Nelspruit 2025",
    description: "Discover the top matric jacket and hoodie trends in Nelspruit for 2025 — bright colours, custom patches, matching friend-group hoodies, and soft fabrics.",
  },
  "why-schools-sublimated-uniforms-athletics-rugby": {
    title: "Why Schools in Nelspruit Are Switching to Sublimated Sports Uniforms",
    description: "Find out why local schools in Nelspruit and Mbombela are choosing sublimated sports uniforms for athletics and rugby — durable, light, and pro-looking.",
  },
  "ultimate-guide-sublimated-netball-uniforms-mbombela": {
    title: "Ultimate Guide to Ordering Sublimated Netball Uniforms in Mbombela",
    description: "A simple guide to ordering sublimated netball uniforms in Mbombela — fabrics, fits, layouts, and what to look for when choosing your team kit.",
  },
  "custom-sublimated-cycling-jerseys-mpumalanga": {
    title: "Custom Sublimated Cycling Jerseys in Mpumalanga",
    description: "Looking for vibrant, aerodynamic custom cycling jerseys in Mpumalanga? Learn where to get sublimated cycling jerseys that fit well and look great on the road.",
  },
  "design-order-sublimated-soccer-kits-nelspruit": {
    title: "How to Design and Order Custom Sublimated Soccer Kits in Nelspruit",
    description: "Step-by-step guide to designing and ordering custom sublimated soccer kits in Nelspruit — colours, logos, numbers, fabric, and sizing.",
  },
  "sublimation-shirt-printing-costs-south-africa": {
    title: "Sublimation Shirt Printing Costs in South Africa",
    description: "What affects sublimation shirt printing costs in South Africa? Learn about design size, colours, quantity, fabric, and turnaround time.",
  },
  "screen-printing-vs-dye-sublimation-nelspruit": {
    title: "Screen Printing vs Dye Sublimation in Nelspruit",
    description: "Screen printing or dye sublimation — which is better for your Nelspruit sports team? Compare both methods and find the right choice for your kit.",
  },
  "sourcing-sublimation-blanks-lowveld": {
    title: "Sourcing Sublimation Blanks in the Lowveld",
    description: "Your guide to sourcing sublimation blanks locally in the Lowveld — Nelspruit and Mbombela. Find the right fabric, colour, and fit for your print job.",
  },
};

const EXTERNAL_LINKS: Record<string, string> = {
  "top-trends-matric-jackets-hoodies-nelspruit": "https://www.etsy.com/market/custom-school-jackets",
  "why-schools-sublimated-uniforms-athletics-rugby": "https://www.printify.com/blog/what-is-sublimation-printing/",
  "ultimate-guide-sublimated-netball-uniforms-mbombela": "https://www.printify.com/blog/what-is-sublimation-printing/",
  "custom-sublimated-cycling-jerseys-mpumalanga": "https://www.printify.com/blog/what-is-sublimation-printing/",
  "design-order-sublimated-soccer-kits-nelspruit": "https://www.printify.com/blog/what-is-sublimation-printing/",
  "sublimation-shirt-printing-costs-south-africa": "https://www.printify.com/blog/what-is-sublimation-printing/",
  "screen-printing-vs-dye-sublimation-nelspruit": "https://www.printful.com/blog/screen-printing-vs-sublimation",
  "sourcing-sublimation-blanks-lowveld": "https://www.printify.com/blog/what-is-sublimation-printing/",
};

const EXPERIENCE_NOTES =
  "These articles were prepared based on current search demand for sublimation printing and custom apparel in South Africa, with a focus on Nelspruit, Mbombela, and the wider Lowveld region. Each guide is aimed at schools, sports teams, and local businesses looking to order custom sublimated uniforms, jerseys, and apparel.";

function slugFromFilename(filename: string): string {
  return filename.replace(/^\d+-/, "").replace(/\.md$/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function mdToHtml(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let inP = false;
  for (const line of lines) {
    const t = line.trim();
    if (!t) { if (inP) { out.push("</p>"); inP = false; } continue; }
    if (/^<h[1-6]|<ul|<ol|<li|<table|<div|<p|<blockquote|<pre|<img|<hr/i.test(t)) {
      if (inP) { out.push("</p>"); inP = false; }
      out.push(t);
      continue;
    }
    if (!inP) { out.push("<p>"); inP = true; }
    out.push(t);
  }
  if (inP) out.push("</p>");
  return out.join("\n");
}

const files = readdirSync(DRAFTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

console.log(`Generating import files for ${files.length} drafts...\n`);

interface PostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  status: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  author_id: string;
  experience_notes: string;
  published_at: string;
}

for (const file of files) {
  const slug = slugFromFilename(file);
  const raw = readFileSync(resolve(DRAFTS_DIR, file), "utf8");
  const html = mdToHtml(raw);

  const contentWithImage = `<p><img src="${PLACEHOLDER_IMAGE}" alt="${META[slug]?.title || "Post"}" /></p>\n${html}`;
  const externalLink = EXTERNAL_LINKS[slug] || "https://www.printify.com/blog/what-is-sublimation-printing/";
  const content = contentWithImage + `\n<p>For more on this topic, see <a href="${externalLink}">this external reference</a>.</p>`;

  const meta = META[slug] || {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    description: `Read our guide on ${slug.replace(/-/g, " ")} on the Blank2Branded blog.`,
  };

  const postData: PostData = {
    title: meta.title,
    slug,
    excerpt: meta.description.slice(0, 160),
    content,
    cover_image_url: PLACEHOLDER_IMAGE,
    status: "published",
    meta_title: meta.title,
    meta_description: meta.description,
    keywords: slug.replace(/-/g, ", "),
    author_id: AUTHOR_ID,
    experience_notes: EXPERIENCE_NOTES,
    published_at: new Date().toISOString(),
  };

  // Save as JSON
  const jsonPath = resolve(OUTPUT_DIR, `${slug}.json`);
  writeFileSync(jsonPath, JSON.stringify(postData, null, 2), "utf8");

  // Also save as a copy-paste HTML file (just the content field)
  const htmlPath = resolve(OUTPUT_DIR, `${slug}-content.html`);
  writeFileSync(htmlPath, postData.content, "utf8");

  // Word count
  const textOnly = postData.content.replace(/<[^>]+>/g, " ").trim();
  const words = textOnly.split(/\s+/).filter(Boolean).length;

  console.log(`✓ ${slug}`);
  console.log(`  Title: ${meta.title}`);
  console.log(`  Slug: /blog/${slug}/`);
  console.log(`  Words: ${words}`);
  console.log(`  Files: ${slug}.json, ${slug}-content.html`);
  console.log();
}

console.log("=== Done ===");
console.log(`Output: ${OUTPUT_DIR}/`);
console.log("\nNext steps:");
console.log("1. Go to https://blank2branded.co.za/login");
console.log("2. Sign in to the admin panel");
console.log("3. Go to /admin/posts/new for each post");
console.log("4. Copy the fields from the .json files, or copy the HTML content from the -content.html files");
console.log("5. Click 'Publish now'");
