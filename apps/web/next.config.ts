import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bible-app/domain"],
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
