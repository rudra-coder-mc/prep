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
  resolve: {
    // The web app's own alias, spelled out here because the root tsconfig no
    // longer owns it: each workspace member has its own paths now.
    alias: { '@': path.join(import.meta.dirname, 'apps/web/src') },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./apps/web/vitest.setup.ts'],
          include: ['apps/web/src/**/*.test.{ts,tsx}', 'packages/*/src/**/*.test.ts'],
          exclude: ['apps/web/src/**/*.integration.test.ts'],
        },
      },
      {
        extends: true,
        resolve: {
          alias: {
            '@': path.join(import.meta.dirname, 'apps/web/src'),
            'server-only': serverOnlyStub,
          },
        },
        test: {
          name: 'integration',
          environment: 'node',
          // better-auth reads its secret when the module is first imported, and
          // these tests run the real thing. The value only has to be stable
          // across one run: nothing signed here outlives the test database.
          env: { BETTER_AUTH_SECRET: 'integration-test-secret' },
          include: ['apps/web/src/**/*.integration.test.ts'],
          hookTimeout: 60_000,
          testTimeout: 60_000,
        },
      },
    ],
  },
})
