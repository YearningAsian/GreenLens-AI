/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Convex _generated files require `npx convex dev` to be running
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/7.x/**',
      },
    ],
  },
};

export default nextConfig;
