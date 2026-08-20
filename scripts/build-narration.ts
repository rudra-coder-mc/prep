import { getAllTopics } from '@/content/loader'
import { cacheDirectory } from '@/lib/speech/cache'
import { narrate } from '@/lib/speech/narrate'
import { SpeechServiceError } from '@/lib/speech/piper'

/**
 * Builds every narration script in `content/` into audio, once.
 *
 * The scripts are static, so there is no reason to synthesise them while
 * somebody is waiting: this turns the whole curriculum into files ahead of time
 * and the app never does the expensive part again. A script that already has a
 * recording is skipped, so running this after adding one topic only builds that
 * topic.
 *
 * It is not part of `npm run build`. Synthesis needs the speech engine running,
 * and the image is built without it - see
 * docs/decisions/0017-narration-is-built-once.md.
 *
 * The parts of the engine are imported directly rather than through
 * `@/lib/speech`, whose `server-only` marker throws outside a server module.
 */
async function main() {
  const topics = await getAllTopics()
  const spoken = topics.filter((topic) => topic.narration !== null)

  console.log(
    `building narration for ${spoken.length} topics into ${cacheDirectory()}, engine at ${process.env.SPEECH_SERVICE_URL ?? 'http://tts:5000'}`,
  )

  let built = 0
  let already = 0

  for (const topic of spoken) {
    const sections = topic.narration ?? []

    // One section at a time. The engine is a single container doing real work,
    // and the whole curriculum arriving at once would only make it slower.
    for (const [position, section] of sections.entries()) {
      const { source } = await narrate(section.script)
      if (source === 'engine') {
        built += 1
        console.log(`  built    ${topic.slug} ${position + 1}/${sections.length} ${section.title}`)
      } else {
        already += 1
      }
    }
  }

  console.log(
    `narration ready: ${built} built, ${already} already there, ${built + already} sections in all`,
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
