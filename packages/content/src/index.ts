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
