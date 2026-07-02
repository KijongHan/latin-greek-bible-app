import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bible-app/domain", "@bible-app/infrastructure"],
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/bible",
        permanent: true,
      },
    ];
  },
  /* config options here */
};

export default nextConfig;
