// Barron supplier integration — server-side only.
// This function is intentionally preview-only until SOAP response/auth is validated.
// It never changes live product or variant records.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://www.blank2branded.co.za",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requiredSecrets = [
  "KEVRO_BASIC_USERNAME", "KEVRO_BASIC_PASSWORD", "KEVRO_USERNAME",
  "KEVRO_PASSWORD", "KEVRO_TOKEN_KEY", "KEVRO_ENTITY_NAME", "KEVRO_ENTITY_ID",
] as const;

function xmlEscape(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function getSecret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server secret: ${name}`);
  return value;
}

function basicAuth(username: string, password: string) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function soapRequest(operation: string, innerXml: string) {
  const url = "https://wslive.kevro.co.za/StockFeed.asmx";
  const basic = basicAuth(getSecret("KEVRO_BASIC_USERNAME"), getSecret("KEVRO_BASIC_PASSWORD"));
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
 <soap:Body><${operation} xmlns="http://tempuri.org/">${innerXml}</${operation}></soap:Body>
</soap:Envelope>`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": basic,
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": `"http://tempuri.org/${operation}"`,
    },
    body: envelope,
    signal: AbortSignal.timeout(120_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Barron SOAP ${operation} returned HTTP ${response.status}: ${body.slice(0, 800)}`);
  return { status: response.status, body, headers: Object.fromEntries(response.headers.entries()) };
}

function decodeXml(value: string) {
  return value.replaceAll("&lt;", "<").replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&");
}

function findXmlValue(xml: string, localName: string): string | null {
  const escaped = localName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<(?:[\\w.-]+:)?${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${escaped}\\s*>`, "i");
  const match = xml.match(re);
  return match ? decodeXml(match[1].trim()) : null;
}

function extractFeedPayload(xml: string): { value: string | null; resultTag: string | null } {
  const candidates = ["GetFeedByEntityIDResult", "string", "anyType"];
  for (const tag of candidates) {
    const value = findXmlValue(xml, tag);
    if (value) return { value, resultTag: tag };
  }
  return { value: null, resultTag: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    for (const secret of requiredSecrets) getSecret(secret);
    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "inspect";
    if (!["inspect", "login-test", "feed-preview"].includes(action)) {
      return Response.json({ error: "Allowed actions: inspect, login-test, feed-preview" }, { status: 400, headers: corsHeaders });
    }

    const username = getSecret("KEVRO_USERNAME");
    const password = getSecret("KEVRO_PASSWORD");
    const entityName = getSecret("KEVRO_ENTITY_NAME");
    const entityId = Number(getSecret("KEVRO_ENTITY_ID"));
    if (!Number.isInteger(entityId) || entityId <= 0) throw new Error("KEVRO_ENTITY_ID must be a positive integer.");

    if (action === "inspect") {
      return Response.json({
        mode: "preview-only",
        endpoint: "https://wslive.kevro.co.za/StockFeed.asmx",
        configuredSecrets: requiredSecrets.map((name) => ({ name, configured: true })),
        pricingFormula: "supplier cost * 1.15 VAT * 1.35 markup",
        priceMultiplier: 1.5525,
        note: "No supplier request or catalogue mutation was made.",
      }, { headers: corsHeaders });
    }

    const loginXml = `<TokenKey>${xmlEscape(getSecret("KEVRO_TOKEN_KEY"))}</TokenKey><username>${xmlEscape(username)}</username><psw>${xmlEscape(password)}</psw><EntityName>${xmlEscape(entityName)}</EntityName><entityID>${entityId}</entityID>`;
    const login = await soapRequest("login", loginXml);
    const loginFault = findXmlValue(login.body, "faultstring");
    const loginResult = findXmlValue(login.body, "loginResult") ?? findXmlValue(login.body, "return");
    if (loginFault) throw new Error(`Barron login SOAP fault: ${loginFault}`);

    if (action === "login-test") {
      return Response.json({
        mode: "read-only connection test",
        httpStatus: login.status,
        loginResult: loginResult?.slice(0, 300) ?? "No recognizable loginResult element; inspect SOAP response format before proceeding.",
        responseHeaders: Object.fromEntries(Object.entries(login.headers).filter(([k]) => ["set-cookie", "content-type"].includes(k.toLowerCase()))),
        note: "No catalogue records were written.",
      }, { headers: corsHeaders });
    }

    // Feed retrieval is deliberately blocked until the vendor's actual WSDL confirms
    // parameter names, session/cookie requirements, and the return-type enum.
    return Response.json({
      mode: "blocked pending WSDL validation",
      loginSucceededResponseDetected: Boolean(loginResult),
      message: "Login request was sent. Validate the exact GetFeedByEntityID WSDL signature and login/session behavior before requesting or parsing the full feed.",
      note: "No catalogue records were written.",
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected supplier integration error" }, { status: 500, headers: corsHeaders });
  }
});
