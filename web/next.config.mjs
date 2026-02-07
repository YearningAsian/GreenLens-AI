/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Convex _generated files require `npx convex dev` to be running
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
