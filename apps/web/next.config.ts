import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@investio/shared",
    "@investio/i18n",
    "@investio/db",
    "@investio/auth",
    "@investio/design-tokens",
  ],
};

export default withNextIntl(nextConfig);
