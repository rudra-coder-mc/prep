import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output exists for the Docker image. Locally it would break
  // `next start`, which the e2e suite relies on, so it is opt-in.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  typedRoutes: true,
}

export default createMDX({})(nextConfig)
