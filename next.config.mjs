/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep production verification isolated from an active development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
