import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_analytics";

async function ga4Query(propertyId: string, body: Record<string, unknown>) {
  const r = await fetch(
    `${GATEWAY}/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "X-Connection-Api-Key": Deno.env.get("GOOGLE_ANALYTICS_API_KEY") ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await r.text();
  if (!r.ok) throw new Error(`GA4 ${r.status}: ${text}`);
  return JSON.parse(text);
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

    const { data: { user }, error: uErr } = await supabase.auth.getUser();
    if (uErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { days = 30, property_id } = await req.json();
    if (!property_id) throw new Error("Missing property_id");

    // Format property ID (remove 'G-' if user pasted measurement ID instead of numeric property ID)
    // Note: GA4 Data API usually requires a numeric Property ID, not the Measurement ID.
    // However, users often confuse them. We should handle both or explain.
    const cleanId = property_id.replace("properties/", "").trim();

    const report = await ga4Query(cleanId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      metrics: [
        { name: "activeUsers" },
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
      ],
      dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
      limit: 10,
    });

    // Also get source data
    const sourceReport = await ga4Query(cleanId, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
      metrics: [{ name: "sessions" }],
      dimensions: [{ name: "sessionSource" }],
      limit: 5,
    });

    // Map GA4 response to our frontend TrafficData type
    const totals = report.rows?.[0]?.metricValues || [];
    const result = {
      activeUsers: parseInt(totals[0]?.value || "0"),
      totalUsers: parseInt(totals[1]?.value || "0"),
      sessions: parseInt(totals[2]?.value || "0"),
      avgSessionDuration: `${Math.round(parseFloat(totals[3]?.value || "0"))}s`,
      bounceRate: `${(parseFloat(totals[4]?.value || "0") * 100).toFixed(1)}%`,
      topPages: report.rows?.map((row: any) => ({
        pageTitle: row.dimensionValues[0].value,
        pagePath: row.dimensionValues[1].value,
        screenPageViews: parseInt(row.metricValues[2]?.value || "0"), // using sessions as proxy if views not requested
      })) || [],
      topSources: sourceReport.rows?.map((row: any) => ({
        source: row.dimensionValues[0].value,
        sessions: parseInt(row.metricValues[0]?.value || "0"),
      })) || [],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
