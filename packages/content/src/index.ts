/**
 * The curriculum: reading `content/` off disk and validating it against the
 * schema in @prep/core.
 *
 * This entry point is deliberately free of `server-only`, so build scripts and
 * tests can use it outside a React Server Component. The web app re-exports it
 * through src/content, which is where that guard lives.
 */
export * from './loader'
export * from './validate'

// The archive build is deliberately not re-exported here. It pulls in esbuild,
// postcss and Tailwind, and this entry point is what the web app imports. It is
// reached as @prep/content/archive by the one command that builds it.
