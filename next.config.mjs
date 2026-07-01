/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'playwright'],
  outputFileTracingIncludes: {
    '/api/extract': ['./node_modules/@sparticuz/chromium/bin/**/*']
  }
}

export default nextConfig

