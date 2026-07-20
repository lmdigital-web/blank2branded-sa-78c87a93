import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: { load: (id: string) => void; page: () => void; track: (event: string, params?: Record<string, unknown>) => void; instance?: (id: string) => unknown; _i?: Record<string, unknown> };
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    pintrk?: ((...args: unknown[]) => void) & { queue?: unknown[]; version?: string };
    uetq?: unknown[];
    _uetq?: unknown[];
    __adsPixelsLoaded?: boolean;
    __adsPixelIds?: Record<string, string>;
  }
}

type PixelRow = { network: string; pixel_id: string | null; enabled: boolean; extra: Record<string, unknown> | null };

export type AdEventName =
  | "page_view"
  | "view_content"
  | "add_to_cart"
  | "initiate_checkout"
  | "purchase"
  | "lead"
  | "search";

let loaded = false;
let pixelsCache: PixelRow[] = [];

export async function initAdPixels() {
  if (typeof window === "undefined") return;
  if (loaded) return;
  loaded = true;

  try {
    const { data } = await supabase
      .from("ad_pixels")
      .select("network,pixel_id,enabled,extra")
      .eq("enabled", true);
    pixelsCache = (data as PixelRow[]) ?? [];
    window.__adsPixelIds = Object.fromEntries(
      pixelsCache.filter((p) => p.pixel_id).map((p) => [p.network, p.pixel_id!]),
    );
  } catch {
    return;
  }

  for (const p of pixelsCache) {
    if (!p.pixel_id) continue;
    try {
      if (p.network === "meta") injectMeta(p.pixel_id);
      else if (p.network === "tiktok") injectTikTok(p.pixel_id);
      else if (p.network === "google") injectGoogle(p.pixel_id, (p.extra?.ga4_id as string) || null);
      else if (p.network === "pinterest") injectPinterest(p.pixel_id);
      else if (p.network === "bing") injectBing(p.pixel_id);
    } catch (e) {
      console.warn(`[ads] failed to inject ${p.network}`, e);
    }
  }

  window.__adsPixelsLoaded = true;
  // capture UTM on landing
  captureUtm();
}

function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const found: Record<string, string> = {};
    for (const k of keys) {
      const v = p.get(k);
      if (v) found[k] = v;
    }
    if (Object.keys(found).length) {
      sessionStorage.setItem("b2b_utm", JSON.stringify(found));
    }
  } catch {}
}

export function getStoredUtm(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem("b2b_utm");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Fire an event across every enabled pixel + log to DB for reporting. */
export function trackEvent(name: AdEventName, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const value = typeof params.value === "number" ? params.value : undefined;
  const currency = (params.currency as string) || "ZAR";
  const utm = getStoredUtm();

  // Meta
  if (window.fbq) {
    const metaMap: Record<AdEventName, string> = {
      page_view: "PageView",
      view_content: "ViewContent",
      add_to_cart: "AddToCart",
      initiate_checkout: "InitiateCheckout",
      purchase: "Purchase",
      lead: "Lead",
      search: "Search",
    };
    window.fbq("track", metaMap[name], value ? { value, currency } : undefined);
  }
  // TikTok
  if (window.ttq) {
    const ttMap: Record<AdEventName, string> = {
      page_view: "Pageview",
      view_content: "ViewContent",
      add_to_cart: "AddToCart",
      initiate_checkout: "InitiateCheckout",
      purchase: "CompletePayment",
      lead: "SubmitForm",
      search: "Search",
    };
    if (name === "page_view") window.ttq.page();
    else window.ttq.track(ttMap[name], value ? { value, currency } : {});
  }
  // Google (gtag)
  if (window.gtag) {
    if (name === "purchase" && value) {
      window.gtag("event", "conversion", { send_to: window.__adsPixelIds?.google, value, currency });
    } else {
      window.gtag("event", name, value ? { value, currency } : {});
    }
  }
  // Pinterest
  if (window.pintrk) {
    const pinMap: Record<AdEventName, string> = {
      page_view: "pagevisit",
      view_content: "viewcategory",
      add_to_cart: "addtocart",
      initiate_checkout: "checkout",
      purchase: "checkout",
      lead: "lead",
      search: "search",
    };
    window.pintrk("track", pinMap[name], value ? { value, currency } : undefined);
  }
  // Bing UET
  if (window.uetq) {
    (window.uetq as unknown[]).push("event", name, value ? { revenue_value: value, currency } : {});
  }

  // Log server-side (fire and forget)
  void supabase.from("ad_events").insert({
    event_type: name,
    value_cents: value ? Math.round(value * 100) : null,
    currency,
    order_id: (params.order_id as string) || null,
    utm_source: utm.utm_source || null,
    utm_medium: utm.utm_medium || null,
    utm_campaign: utm.utm_campaign || null,
    utm_content: utm.utm_content || null,
    utm_term: utm.utm_term || null,
    url: window.location.href,
    referrer: document.referrer || null,
    user_agent: navigator.userAgent,
  });
}

// ---- Snippet injectors (official vendor code, TS-ified) ----

function injectMeta(id: string) {
  if (window.fbq) return;
  (function (f: any, b: Document, e: string, v: string) {
    let n: any, t: HTMLScriptElement, s: HTMLScriptElement | null;
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e) as HTMLScriptElement; t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
    s.parentNode!.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  window.fbq!("init", id);
  window.fbq!("track", "PageView");
}

function injectTikTok(id: string) {
  if (window.ttq) return;
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t; const ttq: any = (w[t] = w[t] || []);
    ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer = function (t: any, e: string) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t: string) { const e = ttq._i[t] || []; for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
    ttq.load = function (e: string) {
      const n = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = n; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); ttq._o = ttq._o || {}; ttq._o[e] = {};
      const o = d.createElement("script"); o.type = "text/javascript"; o.async = true; o.src = n + "?sdkid=" + e + "&lib=" + t;
      const a = d.getElementsByTagName("script")[0]; a.parentNode!.insertBefore(o, a);
    };
    ttq.load(id); ttq.page();
  })(window, document, "ttq");
}

function injectGoogle(adsId: string, ga4Id: string | null) {
  const primary = ga4Id || adsId;
  if (!window.gtag) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${primary}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer!.push(arguments); } as any;
    (window.gtag as any)("js", new Date());
  }
  window.gtag!("config", adsId);
  if (ga4Id) window.gtag!("config", ga4Id);
}

function injectPinterest(id: string) {
  if (window.pintrk) return;
  !(function (e: any) {
    if (!window.pintrk) {
      window.pintrk = function () { (window.pintrk as any).queue.push(Array.prototype.slice.call(arguments)); } as any;
      const n: any = window.pintrk; n.queue = []; n.version = "3.0";
      const t = document.createElement("script"); t.async = true; t.src = e;
      const r = document.getElementsByTagName("script")[0]; r.parentNode!.insertBefore(t, r);
    }
  })("https://s.pinimg.com/ct/core.js");
  window.pintrk!("load", id);
  window.pintrk!("page");
}

function injectBing(id: string) {
  if (window.uetq) return;
  (function (w: any, d: Document, t: string, r: string, u: string) {
    w[u] = w[u] || []; const f = function () { const o: any = { ti: id, enableAutoSpaTracking: true }; o.q = w[u]; w[u] = new (w as any).UET(o); w[u].push("pageLoad"); };
    const n = d.createElement(t) as HTMLScriptElement; n.src = r; n.async = true;
    n.onload = f; (n as any).onreadystatechange = function () { const s = (n as any).readyState; if (s === "loaded" || s === "complete") f(); };
    const s = d.getElementsByTagName(t)[0]; s.parentNode!.insertBefore(n, s);
  })(window, document, "script", "//bat.bing.com/bat.js", "uetq");
}
