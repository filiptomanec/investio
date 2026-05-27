/**
 * SPA build config for Capacitor iOS.
 *
 * This is a SEPARATE config from vite.config.ts (which uses TanStack Start +
 * Nitro for the SSR/Vercel web deploy). This config produces a plain,
 * client-only SPA in dist-spa/ that Capacitor's WKWebView can serve.
 *
 * Key differences from the SSR config:
 * - No TanStack Start / Nitro — pure client-side React + TanStack Router
 * - Output to dist-spa/ instead of .vercel/output/
 * - index.html as the SPA entry with <script type="module">
 * - Uses the same src/spa-entry.tsx (avoids server-only imports in start.ts)
 *
 * Post-build: a plugin renames index.spa.html → index.html so Capacitor
 * finds the file at the conventional path.
 */
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import fs from "fs";

/** Rename the generated HTML artefact to plain index.html after the build. */
function renameHtmlPlugin(): Plugin {
  return {
    name: "rename-spa-html",
    closeBundle() {
      const src = path.resolve(__dirname, "dist-spa/index.spa.html");
      const dest = path.resolve(__dirname, "dist-spa/index.html");
      if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
        console.log("Renamed dist-spa/index.spa.html → dist-spa/index.html");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), renameHtmlPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Use index.spa.html as the HTML entry so the SSR-specific vite.config.ts
  // and its Nitro/TanStack Start machinery are left completely untouched.
  root: ".",
  build: {
    outDir: "dist-spa",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.spa.html"),
    },
  },
  // The SPA serves index.html for all routes; Capacitor handles this natively.
  // No server config needed — this is a static build only.
});
