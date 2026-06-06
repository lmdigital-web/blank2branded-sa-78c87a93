# Deploy to Cloudflare Workers from GitHub

## Goal
Auto-deploy the app to Cloudflare Workers on every push to `main` in `github.com/lmdigital-web/blank2branded-sa`, with SSR + server functions + Supabase backend fully working.

## What I'll change in the codebase

1. **Fix `vite.config.ts`** — remove `nitro: { preset: 'static' }`. It conflicts with the Cloudflare Workers target already wired in `wrangler.jsonc` (which points to `src/server.ts`). Without removing it, the build emits a static site instead of a Worker and SSR + server functions break.

2. **Update `wrangler.jsonc`** — add:
   - `main`: keep `src/server.ts` ✓ (already set)
   - `assets` block pointing at the client build output directory so static assets (JS/CSS/images) are served from the Worker
   - `observability` enabled for logs

3. **Add `.github/workflows/deploy.yml`** — GitHub Actions workflow that:
   - Installs `bun`
   - Runs `bun install` and `bun run build`
   - Runs `bunx wrangler deploy` with secrets from GitHub Actions
   - Triggers on push to `main`

   (Alternative: skip this and use Cloudflare's "Workers Builds" UI to connect the GitHub repo — no workflow file needed. I'll set up Actions as the default since it's more controllable; you can switch to Workers Builds if preferred.)

4. **Add `.dev.vars.example`** — documents the env vars Cloudflare needs (no real values committed).

## What you need to do (one-time, in dashboards)

### A. Cloudflare account
1. Sign in at https://dash.cloudflare.com
2. Note your **Account ID** (right sidebar of any Workers page)
3. Create an **API Token**: My Profile → API Tokens → Create Token → "Edit Cloudflare Workers" template → Create. Copy the token.

### B. GitHub repo secrets
In `github.com/lmdigital-web/blank2branded-sa` → Settings → Secrets and variables → Actions → New repository secret. Add:

| Name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | from step A.3 |
| `CLOUDFLARE_ACCOUNT_ID` | from step A.2 |

### C. Cloudflare Worker environment variables
After the first deploy creates the Worker, go to Workers & Pages → `tanstack-start-app` → Settings → Variables and Secrets, and add:

**Plain variables (build-time, used by Vite):**
- `VITE_SUPABASE_URL` = `https://enpdahmqwhdukbnykqyy.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = (the publishable key from your `.env`)
- `VITE_SUPABASE_PROJECT_ID` = `enpdahmqwhdukbnykqyy`

**Secrets (runtime, server-only):**
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SHOPIFY_ACCESS_TOKEN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `SHOPIFY_ONLINE_ACCESS_TOKEN`
- `LOVABLE_API_KEY`

Get values from Lovable Cloud (already present in this project's secrets). The `VITE_*` ones also need to be available at **build time** in GitHub Actions — I'll wire those into the workflow as repo secrets too (they're publishable, safe to store in GitHub).

### D. Update Supabase redirect URLs
Add your new Cloudflare Workers URL (`https://tanstack-start-app.<your-subdomain>.workers.dev`) to:
- Supabase Auth → URL Configuration → Site URL / Redirect URLs

### E. Update Shopify app URLs (if you use OAuth callbacks)
Update the Shopify app's allowed redirect URIs to include the Workers domain.

## After deploy
- Worker URL: `https://tanstack-start-app.<your-subdomain>.workers.dev`
- Custom domain: in Cloudflare → Workers → your worker → Settings → Domains & Routes → Add Custom Domain. Point your my20i DNS at Cloudflare nameservers first.

## Technical notes
- The app uses TanStack Start with the Cloudflare Worker preset (`src/server.ts` is the Worker entry). `wrangler.jsonc` already targets it correctly.
- Supabase stays on Lovable Cloud — Cloudflare just calls it over HTTPS. No data migration needed.
- `LOVABLE_API_KEY` works outside Lovable as long as it's set as a Worker secret.
- Build output: `bun run build` produces `dist/` (client assets) and `.output/` (Worker bundle). `wrangler deploy` uploads both.

## Order of execution
1. I make the 3-4 file changes
2. You add the 2 GitHub secrets (API token + Account ID)
3. Push to `main` (or I trigger via Lovable→GitHub sync)
4. First deploy runs; Worker is created
5. You add the 10 env vars/secrets in Cloudflare dashboard
6. Push again (or redeploy from Cloudflare UI) to pick up the env vars
7. Update Supabase + Shopify redirect URLs
8. (Optional) Custom domain

Ready to start on step 1?