import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="cs" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  );
}
