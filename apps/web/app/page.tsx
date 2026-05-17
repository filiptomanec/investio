import { redirect } from "next/navigation";

/**
 * Root route redirects to the default locale.
 * The middleware (next-intl) handles locale detection for most routes,
 * but this fallback ensures the bare "/" path always resolves.
 */
export default function RootPage() {
  redirect("/cs");
}
