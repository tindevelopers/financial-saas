/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization - all pages are dynamic
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname),
  },
  // Skip static generation for these routes
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Ensure Next.js only resolves routes from app directory, not node_modules
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
}

module.exports = nextConfig
