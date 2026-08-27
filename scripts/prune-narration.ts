import { cacheDirectory } from '@/lib/speech/cache'
import { pruneRecordings } from '@/lib/speech/prune'

/**
 * Deletes every recording no script in `content/` hashes to any more.
 * `npm run speech:prune`.
 *
 * Recordings are content addressed and kept forever, so editing a script makes
 * a new one and strands the old, and the cache only grows. This is the sweep
 * that keeps it a cache. It needs no engine: it compares filenames against the
 * keys content currently produces.
 *
 * Deleting more than intended costs the wait to record it again, not
 * correctness, which is why this reports what went rather than asking first.
 *
 * The parts of the engine are imported directly rather than through
 * `@/lib/speech`, whose `server-only` marker throws outside a server module.
 */
async function main() {
  const directory = cacheDirectory()
  const { deleted, kept } = await pruneRecordings(directory)

  for (const key of deleted) console.log(`  deleted  ${key}`)

  console.log(
    `${directory}: ${deleted.length} deleted, ${kept} still spoken by something in content`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
