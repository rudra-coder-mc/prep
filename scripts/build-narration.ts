import { cacheDirectory } from '../apps/web/src/lib/speech/cache'
import {
  buildRecordings,
  plannedRecordings,
  topicsIn,
  unrecorded,
} from '../apps/web/src/lib/speech/build'
import { SpeechServiceError } from '../apps/web/src/lib/speech/piper'

/**
 * Records everything in a track that can be listened to: every narration
 * section, and for every question one recording of the prompt and one of the
 * answer with its explanation.
 *
 * `npm run narration:build -- javascript` for a whole track, or
 * `npm run narration:build -- javascript/closures` for one topic.
 *
 * A track is the unit because a track is what a device downloads before a
 * journey. Audio is still made when it is asked for on the web, which is
 * decision `0029`; what changed is that a phone out of reach of the server
 * cannot ask, so a listen button with no recording behind it is a dead end
 * rather than a wait. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 *
 * Anything already recorded is skipped, so running it twice is cheap and
 * running it after an edit records only what changed.
 *
 * It says what is missing before it starts and reads the cache again when it
 * finishes, so "this track is fully recorded" is something the filesystem
 * answers rather than something a counter claims. That is the whole point: a
 * run of this was once stopped partway, its log was lost, and nobody could tell
 * afterwards what had been built.
 *
 * The parts of the engine are imported directly rather than through
 * `@/lib/speech`, whose `server-only` marker throws outside a server module.
 */
async function main() {
  const target = process.argv[2]
  if (target === undefined) {
    throw new Error(
      'name what to record: npm run narration:build -- javascript, or javascript/closures for one topic',
    )
  }

  const topics = await topicsIn(target)
  const planned = plannedRecordings(topics)
  const missing = await unrecorded(planned)

  // A topic names itself in the target, so counting it there would only read as
  // "1 topics".
  const scope =
    topics.length === 1
      ? `${planned.length} scripts`
      : `${topics.length} topics, ${planned.length} scripts`

  console.log(
    `${target}: ${scope}, into ${cacheDirectory()}, engine at ${process.env.SPEECH_SERVICE_URL ?? 'http://tts:5000'}`,
  )
  console.log(`${planned.length - missing.length} already recorded, ${missing.length} to record`)

  if (missing.length === 0) {
    console.log(`${target} is fully recorded: nothing to do`)
    return
  }

  // Counted out here as well as inside the build, so a run that stops partway
  // can still say what it made. Losing that is the reason this command exists.
  let made = 0

  try {
    await buildRecordings(missing, (item, done, total) => {
      made = done
      console.log(`  ${String(done).padStart(String(total).length)}/${total}  ${item.what}`)
    })
  } catch (error) {
    console.error(`stopped after recording ${made} of ${missing.length}`)
    throw error
  }

  const left = await unrecorded(planned)
  if (left.length > 0) {
    throw new Error(
      `${target} is not fully recorded: ${left.length} of ${planned.length} scripts still have no audio, starting with ${left[0]?.what}`,
    )
  }

  console.log(
    `${target} is fully recorded: ${planned.length} scripts, ${made} made now, ${planned.length - made} already there`,
  )
}

main().catch((error: unknown) => {
  if (error instanceof SpeechServiceError) {
    // npm run narration:build starts the engine itself, so reaching this means
    // it stopped partway rather than never started. Recordings already made are
    // kept, so running the command again picks up where this left off.
    console.error(
      `${error.message}. It is started by this command, so it has stopped mid-run: check "docker compose logs tts", then run this again to carry on.`,
    )
  } else {
    console.error(error instanceof Error ? error.message : error)
  }
  process.exit(1)
})
