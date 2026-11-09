/**
 * insert-posts-service-role.ts
 *
 * Inserts all 8 ready-to-import blog posts into Supabase `posts`
 * using the SERVICE ROLE key (bypasses RLS).
 *
 * Usage:
 *   1. Put SUPABASE_SERVICE_ROLE_KEY in .env (or export it in the shell).
 *   2. Run: bun run scripts/insert-posts-service-role.ts
 *
 * The script:
 *   - reads every drafts/ready-to-import/*.json (excluding *-content.html)
 *   - skips posts whose slug already exists (safe to re-run)
 *   - reports a summary at the end
 */

import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

// --- load .env manually (no dependency on dotenv) ---
try {
  for (const line of readFileSync(resolve(".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // no .env file; rely on process.env
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY (and/or VITE_SUPABASE_URL) in .env.\n" +
      "Add it from Supabase Dashboard → Project Settings → API → service_role secret key."
  );
  process.exit(1);
}

const DIR = resolve("drafts", "ready-to-import");
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));

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

async function sbFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY!}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  return res;
}

async function main() {
  console.log(`Inserting ${files.length} posts into ${SUPABASE_URL} ...\n`);

  // existing slugs
  const existingRes = await sbFetch("posts?select=slug");
  if (!existingRes.ok) {
    console.error(`Failed to fetch existing posts: ${existingRes.status} ${await existingRes.text()}`);
    process.exit(1);
  }
  const existing = new Set(
    ((await existingRes.json()) as { slug: string }[]).map((r) => r.slug)
  );

  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files.sort()) {
    const post = JSON.parse(readFileSync(resolve(DIR, file), "utf8")) as PostData;

    if (existing.has(post.slug)) {
      console.log(`↷ skipped (already exists): ${post.slug}`);
      skipped++;
      continue;
    }

    const res = await sbFetch("posts", {
      method: "POST",
      body: JSON.stringify([post]),
    });

    if (res.ok) {
      console.log(`✓ inserted: ${post.slug}  (/blog/${post.slug}/)`);
      inserted++;
    } else {
      const body = await res.text();
      console.error(`✗ FAILED ${post.slug}: ${res.status} ${body.slice(0, 300)}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${inserted} inserted, ${skipped} skipped, ${failed} failed ===`);
  if (inserted > 0) {
    console.log("\nNext: push to main (or wait for next deploy) — prerender-blog.ts will pick up the new posts and they will appear on the site.");
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
