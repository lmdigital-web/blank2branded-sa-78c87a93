import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") ?? "";
  const allowed = new Set([
    "https://blank2branded.co.za",
    "https://www.blank2branded.co.za",
    "https://blank2branded-sa.pages.dev",
  ]);
  // Allow only this Cloudflare Pages project's branch-preview subdomains.
  const isProjectPreview = /^https:\/\/[a-z0-9-]+\\.blank2branded-sa\\.pages\\.dev$/i.test(origin);
  const allowOrigin = origin && (allowed.has(origin) || origin === allowedOrigin || isProjectPreview)
    ? origin
    : "https://www.blank2branded.co.za";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const SECRET_NAMES = ["KEVRO_BASIC_USERNAME","KEVRO_BASIC_PASSWORD","KEVRO_USERNAME","KEVRO_PASSWORD","KEVRO_TOKEN_KEY","KEVRO_ENTITY_NAME","KEVRO_ENTITY_ID"] as const;
const endpoint = "https://wslive.kevro.co.za/StockFeed.asmx";

function secret(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error("Missing Edge Function secret: " + name);
  return v;
}
function basicHeader() {
  return "Basic " + btoa(secret("KEVRO_BASIC_USERNAME") + ":" + secret("KEVRO_BASIC_PASSWORD"));
}
function parseXmlTag(xml: string, tag: string): string | null {
  const re = new RegExp("<(?:[\\w.-]+:)?" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?" + tag + "\\s*>", "i");
  const m = xml.match(re);
  if (!m) return null;
  return m[1].trim().replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replaceAll("&apos;","'").replaceAll("&amp;","&");
}
function getCookie(response: Response): string {
  const sc = response.headers.get("set-cookie");
  if (!sc) return "";
  const m = sc.match(/(?:ASP\.NET_SessionId|ASP\.NET_SessionId)=([^;,]+)/i) ?? sc.match(/([^=;,\s]+=[^;,]+)/);
  return m ? m[0].split(";")[0] : "";
}
function q(value: string) { return encodeURIComponent(value); }

async function supplierGet(path: string, params: Record<string,string>, cookie = "") {
  const url = endpoint + "/" + path + "?" + new URLSearchParams(params).toString();
  const headers: Record<string,string> = { Authorization: basicHeader(), Accept: "application/xml, text/xml, */*" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(180000) });
  const text = await res.text();
  if (!res.ok) throw new Error("Barron " + path + " HTTP " + res.status + ": " + text.slice(0,400));
  return { response: res, text };
}

async function login() {
  const params = {
    TokenKey: secret("KEVRO_TOKEN_KEY"),
    username: secret("KEVRO_USERNAME"),
    psw: secret("KEVRO_PASSWORD"),
    EntityName: secret("KEVRO_ENTITY_NAME"),
    entityID: secret("KEVRO_ENTITY_ID"),
  };
  const {response, text} = await supplierGet("login", params);
  const result = parseXmlTag(text, "Callresult");
  const error = parseXmlTag(text, "ErrorMsg");
  if (result?.toLowerCase() !== "true" && !/success/i.test(text)) {
    throw new Error("Barron login did not return success. " + (error || text.slice(0,300)));
  }
  const cookie = getCookie(response);
  return cookie;
}

function parseFeed(xml: string): unknown[] {
  const data = parseXmlTag(xml, "ResponseData");
  if (!data) throw new Error("Barron feed response has no ResponseData. Response: " + xml.slice(0,400));
  const decoded = data.trim();
  let parsed: any;
  try { parsed = JSON.parse(decoded); }
  catch {
    try { parsed = JSON.parse(decoded.replaceAll("&quot;", '"').replaceAll("\\/", "/")); }
    catch { throw new Error("Barron ResponseData was not valid JSON. First bytes: " + decoded.slice(0,300)); }
  }
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    for (const key of ["Table","table","data","Data","Feed","feed","Items","items"]) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
    const values = Object.values(parsed);
    if (values.length && values.every(v => v && typeof v === "object")) return values as unknown[];
  }
  throw new Error("Unrecognized Barron feed JSON structure.");
}
function val(row: any, ...keys: string[]): any {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "") return row[key];
    const found = Object.keys(row ?? {}).find(k => k.toLowerCase() === key.toLowerCase());
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== "") return row[found];
  }
  return null;
}
function num(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/,/g,""));
  return Number.isFinite(n) ? n : null;
}
function integer(v: any): number | null {
  const n = num(v); return n === null ? null : Math.trunc(n);
}
function mapRow(row: any, runId: string) {
  const base = num(val(row,"BasePrice"));
  const discounted = num(val(row,"DiscountBasePrice","DiscountedPrice"));
  const cost = discounted !== null && discounted > 0 ? discounted : base;
  return {
    sync_run_id: runId,
    supplier_stock_code: val(row,"StockCode") == null ? null : String(val(row,"StockCode")),
    supplier_stock_header_id: val(row,"StockHeaderID") == null ? null : String(val(row,"StockHeaderID")),
    supplier_stock_id: val(row,"StockID") == null ? null : String(val(row,"StockID")),
    description: val(row,"Description") == null ? null : String(val(row,"Description")),
    colour: val(row,"Colour") == null ? null : String(val(row,"Colour")),
    size: val(row,"Size") == null ? null : String(val(row,"Size")),
    category: val(row,"Category") == null ? null : String(val(row,"Category")),
    supplier_brand: val(row,"Brand") == null ? null : String(val(row,"Brand")),
    supplier_base_price: base,
    supplier_discount_base_price: discounted,
    qty_available: integer(val(row,"QtyAvailable")),
    warehouse_bond: integer(val(row,"WH3(BOND)")),
    warehouse_bw: integer(val(row,"WH4(BW)")),
    weight_per_unit: num(val(row,"WeightPerUnit")),
    image_url: val(row,"Image") == null ? null : String(val(row,"Image")),
    raw_record: row,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:corsHeaders(req)});
  if (req.method !== "POST") return Response.json({error:"POST required"},{status:405,headers:corsHeaders});
  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) return Response.json({error:"Authorization required"},{status:401,headers:corsHeaders});
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service credentials unavailable in Edge Function.");
    const db = createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const token = auth.slice("Bearer ".length);
    const {data: authData,error: authError} = await db.auth.getUser(token);
    if (authError || !authData.user) return Response.json({error:"Valid user session required"},{status:401,headers:corsHeaders});
    const {data: accessRow,error: accessError} = await db.from("supplier_sync_access").select("user_id").eq("user_id",authData.user.id).maybeSingle();
    if (accessError || !accessRow) return Response.json({error:"Supplier sync access required"},{status:403,headers:corsHeaders});
    for (const n of SECRET_NAMES) secret(n);
    const payload = await req.json().catch(()=>({}));
    const action = payload.action ?? "inspect";
    if (!["inspect","login-test","feed-preview"].includes(action)) {
      return Response.json({error:"Allowed actions: inspect, login-test, feed-preview"},{status:400,headers:corsHeaders});
    }
    if (action === "inspect") {
      return Response.json({mode:"preview-only",secretsConfigured:SECRET_NAMES.map(name=>({name,configured:true})),pricing:{vat:0.15,markup:0.35,multiplier:1.5525},note:"Admin authenticated. No supplier request or catalogue write performed."},{headers:corsHeaders(req)});
    }
    const cookie = await login();
    if (action === "login-test") {
      return Response.json({success:true,sessionCookieReceived:Boolean(cookie),message:"Barron login returned success. No catalogue records changed."},{headers:corsHeaders(req)});
    }
    const entityID = secret("KEVRO_ENTITY_ID");
    const params = {entityID,username:secret("KEVRO_USERNAME"),psw:secret("KEVRO_PASSWORD"),ReturnType:"JSON"};
    const {text: feedXml} = await supplierGet("GetFeedByEntityID",params,cookie);
    const callResult = parseXmlTag(feedXml,"Callresult");
    const errorMsg = parseXmlTag(feedXml,"ErrorMsg");
    if (callResult && callResult.toLowerCase() !== "true") throw new Error("Barron feed call failed: " + (errorMsg || "unknown supplier error"));
    const rows = parseFeed(feedXml);
    if (!rows.length) throw new Error("Barron returned an empty feed; staging was not changed.");
    const {data: run,error: runErr} = await db.from("barron_sync_runs").insert({status:"running",trigger_source:"manual-preview",feed_row_count:rows.length,metadata:{mode:"feed-preview"}}).select("id").single();
    if (runErr || !run) throw new Error("Could not create sync run: " + runErr?.message);
    const mapped = rows.map((r:any)=>mapRow(r,run.id));
    for (let i=0;i<mapped.length;i+=500) {
      const {error} = await db.from("barron_supplier_feed_staging").insert(mapped.slice(i,i+500));
      if (error) {
        await db.from("barron_sync_runs").update({status:"failed",completed_at:new Date().toISOString(),error_message:error.message}).eq("id",run.id);
        throw new Error("Staging insert failed: " + error.message);
      }
    }
    const distinct = new Set(mapped.map(r=>r.supplier_stock_header_id).filter(Boolean)).size;
    await db.from("barron_sync_runs").update({status:"preview",completed_at:new Date().toISOString(),distinct_item_count:distinct,metadata:{mode:"feed-preview",rowsStaged:mapped.length}}).eq("id",run.id);
    return Response.json({success:true,mode:"feed-preview-staged",runId:run.id,feedRows:mapped.length,distinctStockHeaderIds:distinct,stagedRows:mapped.length,priceRule:"supplier cost * 1.15 * 1.35",sample:mapped.slice(0,8).map(r=>({stockCode:r.supplier_stock_code,headerId:r.supplier_stock_header_id,stockId:r.supplier_stock_id,description:r.description,colour:r.colour,size:r.size,supplierCost:r.supplier_discount_base_price??r.supplier_base_price,qty:r.qty_available,retailPreview:r.supplier_discount_base_price!=null?Number((r.supplier_discount_base_price*1.5525).toFixed(2)):r.supplier_base_price!=null?Number((r.supplier_base_price*1.5525).toFixed(2)):null})),note:"Only staging tables were written. Existing storefront products, quantities and retail prices were not changed."},{headers:corsHeaders(req)});
  } catch (e) {
    return Response.json({error:e instanceof Error?e.message:"Unexpected Barron integration error"},{status:500,headers:corsHeaders});
  }
});
