// @lovable.dev/vite-tanstack-config provides the full Vite config for Lovable
// TanStack Start projects (TanStack Start plugin, React, Tailwind v4, Cloudflare
// build target via Nitro, error loggers, dev sandbox detection, etc.).
// Do NOT add tanstackStart, viteReact, tailwindcss, tsConfigPaths, or cloudflare
// plugins manually — they'd be duplicated.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Required for self-hosting builds from VS Code/GitHub. Without this, the
  // helper intentionally skips the Worker bundling outside Lovable, so deploys
  // to Cloudflare do not get the built server package they need.
  nitro: true,
});
