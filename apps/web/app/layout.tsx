import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investio",
  description:
    "Investiční kalkulačka pro porovnání nemovitostí a akciových investic",
};

/**
 * Root layout — minimal shell used only for the root redirect page.
 * The actual locale-aware layout lives in app/[locale]/layout.tsx.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
