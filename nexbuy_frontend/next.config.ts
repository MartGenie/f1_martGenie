import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, "");

    if (!backendOrigin) {
      throw new Error(
        "Missing BACKEND_ORIGIN. Set it to the deployed backend origin before building the frontend.",
      );
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
