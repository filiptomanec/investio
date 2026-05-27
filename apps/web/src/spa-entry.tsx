/**
 * SPA entry point for Capacitor / iOS build.
 *
 * Unlike start.ts (which uses @tanstack/react-start for SSR), this file boots
 * a pure client-side React app using @tanstack/react-router directly.
 * It imports the same router/routes, so the app is byte-for-byte identical
 * to the web — only the rendering mode differs (CSR vs. SSR).
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
// Mark native platform ASAP so CSS gates apply before first paint.
import { markNativePlatform } from "./lib/native";
markNativePlatform();

const router = getRouter();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Missing #root element");

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
