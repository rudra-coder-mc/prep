import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output exists for the Docker image. Locally it would break
  // `next start`, which the e2e suite relies on, so it is opt-in.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // CLAUDE.md is hand written policy for this repo. Next appends its own block
  // to it on every dev run, which is not ours to keep.
  agentRules: false,
  typedRoutes: true,
}

export default createMDX({})(nextConfig)
