import { cacheDirectory } from '../apps/web/src/lib/speech/cache'
import { transcodeRecordings } from '../apps/web/src/lib/speech/transcode'

/**
 * Converts a cache of uncompressed recordings to Opus in place.
 * `npm run speech:transcode`.
 *
 * This is a migration. Recordings made before
 * docs/decisions/0036-recordings-are-stored-compressed.md are WAV, and the app
 * only reads Opus, so a cache that has not been through this is a cache the app
 * treats as empty and re-synthesises from scratch.
 *
 * **Run `npm run speech:prune` first.** A cache holds recordings for scripts
 * that have since been edited, and converting those spends the engine on files
 * nothing will ever ask for.
 *
 * Safe to run twice, and safe to interrupt: each recording is converted and its
 * WAV deleted before the next is started, so a run that stops halfway leaves a
 * part-converted cache that the next run finishes.
 *
 * The parts of the engine are imported directly rather than through
 * `@/lib/speech`, whose `server-only` marker throws outside a server module.
 */
function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(0)} MB`
}

async function main() {
  const directory = cacheDirectory()

  const run = await transcodeRecordings(directory, (key, done, total) => {
    console.log(`  ${String(done).padStart(String(total).length)}/${total}  ${key}`)
  })

  if (run.converted.length === 0 && run.alreadyCompressed === 0) {
    console.log(`${directory}: nothing uncompressed left, so there is nothing to do`)
    return
  }

  const saved = run.bytesBefore - run.bytesAfter
  console.log(
    `${directory}: ${run.converted.length} converted, ${megabytes(run.bytesBefore)} down to ${megabytes(run.bytesAfter)}, ${megabytes(saved)} saved`,
  )

  if (run.alreadyCompressed > 0) {
    console.log(`${run.alreadyCompressed} were already converted, and their leftovers were cleared`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
