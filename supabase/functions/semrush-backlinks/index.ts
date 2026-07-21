// Semrush backlinks proxy for admin dashboard
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

async function semrush(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${GATEWAY}${path}?${qs}`, {
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("SEMRUSH_API_KEY") ?? "",
      "Allow-Limit-Offset": "true",
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Semrush ${r.status}: ${text}`);
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { return { raw: text }; }
  if (parsed?.error) throw new Error(String(parsed.error));
  return parsed;
}

function rowsToObjects(payload: any): Array<Record<string, any>> {
  const data = payload?.data ?? payload;
  const cols: string[] = data?.columnNames ?? [];
  const rows: any[][] = data?.rows ?? [];
  return rows.map((row) => {
    const o: Record<string, any> = {};
    cols.forEach((c, i) => (o[c] = row[i]));
    return o;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const token = auth.replace("Bearer ", "");
    const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Use service role to bypass RLS when checking admin role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleRow, error: rErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", claims.claims.sub)
      .eq("role", "admin")
      .maybeSingle();
    if (rErr || !roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden", details: rErr?.message }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const body = await req.json().catch(() => ({}));
    const target: string = body.target ?? "blank2branded.co.za";
    const target_type: string = body.target_type ?? "root_domain";

    const [overview, refDomains, anchors, pages] = await Promise.all([
      semrush("/backlinks/backlinks_overview", {
        target,
        target_type,
        export_columns: "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num,forms_num,frames_num",
      }),
      semrush("/backlinks/backlinks_refdomains", {
        target,
        target_type,
        export_columns: "domain,domain_ascore,backlinks_num,ip",
        display_limit: "25",
      }),
      semrush("/backlinks/backlinks_anchors", {
        target,
        target_type,
        export_columns: "anchor,domains_num,backlinks_num,first_seen,last_seen",
        display_limit: "25",
      }),
      semrush("/backlinks/backlinks_pages", {
        target,
        target_type,
        export_columns: "response_code,backlinks_num,domains_num,source_url,source_title,last_seen",
        display_limit: "25",
      }),
    ]);

    return new Response(
      JSON.stringify({
        target,
        target_type,
        overview: rowsToObjects(overview)[0] ?? null,
        refDomains: rowsToObjects(refDomains),
        anchors: rowsToObjects(anchors),
        pages: rowsToObjects(pages),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = String(e instanceof Error ? e.message : e);
    const quota = /TOTAL LIMIT EXCEEDED|ERROR 134/i.test(msg);
    return new Response(
      JSON.stringify({
        error: quota
          ? "Semrush API quota exhausted. Upgrade your Semrush plan or wait for the daily reset."
          : msg,
        quota_exceeded: quota,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
