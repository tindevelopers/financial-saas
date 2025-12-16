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
}

module.exports = nextConfig
