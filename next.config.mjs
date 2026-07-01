/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium', 'playwright']
}

export default nextConfig

