import { createRequire } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * `server-only` throws on import unless the bundler resolves it under React's
 * server condition, which vitest does not do. Integration tests run real server
 * modules, so they resolve it to the package's own empty build instead.
 */
const require = createRequire(import.meta.url)
// The package ships the empty build but does not export the subpath, so it is
// reached from the entry point rather than imported by name.
const serverOnlyStub = path.join(path.dirname(require.resolve('server-only')), 'empty.js')

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        resolve: { alias: { 'server-only': serverOnlyStub } },
        test: {
          name: 'integration',
          environment: 'node',
          include: ['src/**/*.integration.test.ts'],
          hookTimeout: 60_000,
          testTimeout: 60_000,
        },
      },
    ],
  },
})
