// Scans published blog posts for outbound shop links and validates them
// against the Shopify Storefront API. Upserts results into blog_link_issues.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SHOP_DOMAIN = "ufg0w7-mr.myshopify.com";
const STOREFRONT_URL = `https://${SHOP_DOMAIN}/api/2025-07/graphql.json`;
const STOREFRONT_TOKEN = "a10d448868c45c91fccf6cf354ec66e7";
const SHOP_HOSTS = ["blank2branded.co.za", "www.blank2branded.co.za", SHOP_DOMAIN];

async function checkHandle(kind: "product" | "collection", handle: string): Promise<boolean> {
  const query =
    kind === "product"
      ? `query($h: String!) { productByHandle(handle: $h) { id availableForSale } }`
      : `query($h: String!) { collectionByHandle(handle: $h) { id } }`;
  const r = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN },
    body: JSON.stringify({ query, variables: { h: handle } }),
  });
  if (!r.ok) return false;
  const j: any = await r.json();
  const node = kind === "product" ? j?.data?.productByHandle : j?.data?.collectionByHandle;
  return !!node;
}

function extractShopLinks(html: string): string[] {
  const out = new Set<string>();
  const re = /href=["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (href.startsWith("/products/") || href.startsWith("/collections/")) {
      out.add(href);
    } else {
      try {
        const u = new URL(href);
        if (SHOP_HOSTS.some((h) => u.hostname.endsWith(h))) out.add(href);
      } catch {
        /* ignore */
      }
    }
  }
  return [...out];
}

function classify(url: string): { kind: "product" | "collection" | "other"; handle: string | null } {
  try {
    const u = new URL(url, "https://blank2branded.co.za");
    const m1 = u.pathname.match(/^\/products\/([^/?#]+)/);
    if (m1) return { kind: "product", handle: decodeURIComponent(m1[1]) };
    const m2 = u.pathname.match(/^\/collections\/([^/?#]+)/);
    if (m2) return { kind: "collection", handle: decodeURIComponent(m2[1]) };
  } catch { /* */ }
  return { kind: "other", handle: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: posts, error } = await supabase
      .from("posts")
      .select("id,content")
      .eq("status", "published");
    if (error) throw error;

    let scanned = 0;
    let broken = 0;

    for (const post of posts ?? []) {
      const links = extractShopLinks(post.content || "");
      // Mark previously-broken links as resolved if no longer present
      await supabase
        .from("blog_link_issues")
        .update({ resolved_at: new Date().toISOString() })
        .eq("post_id", post.id)
        .is("resolved_at", null)
        .not("url", "in", `(${links.map((l) => `"${l.replace(/"/g, '\\"')}"`).join(",") || '""'})`);

      for (const url of links) {
        scanned++;
        const { kind, handle } = classify(url);
        let ok = true;
        let issue_type = "404";
        let status_code: number | null = null;
        let suggested: string | null = null;

        if (kind === "product" && handle) {
          ok = await checkHandle("product", handle);
          if (!ok) {
            issue_type = "deleted_product";
            suggested = handle; // raw broken handle as hint
          }
        } else if (kind === "collection" && handle) {
          ok = await checkHandle("collection", handle);
          if (!ok) issue_type = "deleted_product";
        } else {
          // Plain HEAD check for non-product shop URLs
          try {
            const r = await fetch(url, { method: "HEAD", redirect: "follow" });
            status_code = r.status;
            ok = r.ok;
            if (!ok) issue_type = "404";
          } catch {
            ok = false;
            issue_type = "unreachable";
          }
        }

        if (!ok) {
          broken++;
          await supabase
            .from("blog_link_issues")
            .upsert(
              {
                post_id: post.id,
                url,
                status_code,
                issue_type,
                suggested_handle: suggested,
                resolved_at: null,
                last_checked_at: new Date().toISOString(),
              },
              { onConflict: "post_id,url" },
            );
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, posts: posts?.length ?? 0, scanned, broken }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
