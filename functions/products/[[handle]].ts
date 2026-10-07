// Redirect removed / renamed product URLs to the surviving product.
//
// The duplicate-catalogue cleanup removed 1,910 duplicate product URLs and
// renamed 91 more. Writing them all into public/_redirects would exceed the
// 2,000 static-redirect limit for a Cloudflare Pages project, and the
// `/* /index.html 200` SPA fallback would otherwise serve them a 200 with the
// homepage canonical, which Google reads as a soft-404.
//
// Cloudflare applies _redirects only to requests that are NOT served by a
// Pages Function, so this route takes precedence over the SPA fallback: a
// handle in the map is redirected, anything else falls through to the
// prerendered static asset for that product.
//
// public/_routes.json limits invocation to /products/* so every other route
// stays on the free unlimited static path.

import { PRODUCT_REDIRECTS } from "../../src/generated/product-redirects"

export const onRequest: PagesFunction = async ({ request, env, params }) => {
  const raw = params.handle
  const handle = (Array.isArray(raw) ? raw.join("/") : raw ?? "").trim()
  const target = PRODUCT_REDIRECTS[handle]

  if (target) {
    const url = new URL(request.url)
    const location = `/products/${target}/${url.search}`
    return new Response(null, {
      status: 301,
      headers: { Location: location, "Cache-Control": "public, max-age=86400" },
    })
  }

  // A live product: serve the prerendered HTML exactly as before.
  return env.ASSETS.fetch(request)
}