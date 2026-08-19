import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:3333"
    return [
      {
        source: "/uploads/recipes/:path*",
        destination: `${apiUrl}/uploads/recipes/:path*`,
      },
    ]
  },
}

export default nextConfig;
