import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), mcpPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
