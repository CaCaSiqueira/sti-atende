import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Assistente IA é a porta de entrada, como no protótipo.
  async redirects() {
    return [{ source: "/", destination: "/assistente", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
