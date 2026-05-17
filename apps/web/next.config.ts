import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@investio/shared",
    "@investio/i18n",
    "@investio/db",
    "@investio/auth",
    "@investio/design-tokens",
  ],
};

export default nextConfig;
