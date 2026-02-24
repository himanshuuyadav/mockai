/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ["recharts", "framer-motion"],
  },
};

export default nextConfig;
