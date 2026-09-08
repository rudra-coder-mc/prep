import path from 'node:path'
import createMDX from '@next/mdx'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output exists for the Docker image. Locally it would break
  // `next start`, which the e2e suite relies on, so it is opt-in.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  // Standalone traces from the repository root rather than from this app, so
  // the workspace packages it imports are carried into the image with it.
  outputFileTracingRoot: path.join(import.meta.dirname, '..', '..'),
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // agent.md is hand written policy for this repo. Next appends its own block
  // to it on every dev run, which is not ours to keep.
  agentRules: false,
  typedRoutes: true,
  // The workspace packages ship TypeScript source rather than a build, so Next
  // compiles them the way it compiles this app. See
  // docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
  transpilePackages: ['@prep/core', '@prep/content'],
  // The loader reads the curriculum off disk at request time, which no static
  // trace can see, so the standalone build is told to carry it.
  outputFileTracingIncludes: {
    '/topics/**': ['../../packages/content/content/**/*'],
  },
}

export default createMDX({})(nextConfig)
