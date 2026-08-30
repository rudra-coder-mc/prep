import 'server-only'

/**
 * Server-side entry point for content. The loader itself lives in
 * @prep/content so that build scripts and tests can use it outside a React
 * Server Component, and this is where the guard against reaching it from a
 * client component lives.
 */
export * from '@prep/content'
