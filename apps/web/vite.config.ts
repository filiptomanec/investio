// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Force Nitro on with Vercel preset so `vite build` emits a Vercel-deployable bundle.
  // Without this override the wrapper only runs Nitro inside Lovable's sandbox.
  //
  // The wrapper hard-codes output.{dir,serverDir,publicDir} to `dist/*` defaults that
  // point Nitro at the wrong layout for Vercel's Build Output API v3 — Vercel can't
  // auto-detect `dist/`, it only auto-detects `.vercel/output/`. We re-pin to the
  // canonical Vercel layout so Vercel sees `functions/__server.func/index.mjs` +
  // `static/` + `config.json` exactly where it expects them.
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
});
