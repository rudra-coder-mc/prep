import { getTopic, type Topic } from '@/content/loader'
import { cacheDirectory } from '@/lib/speech/cache'
import { narrate } from '@/lib/speech/narrate'
import { SpeechServiceError } from '@/lib/speech/piper'
import { answerScript, questionScript } from '@/lib/speech/spoken-question'

/**
 * Records everything in one topic that can be listened to: every narration
 * section, and for every question one recording of the prompt and one of the
 * answer with its explanation.
 *
 * `npm run narration:build -- javascript/closures`.
 *
 * Nothing depends on this. A recording is made the first time it is asked for,
 * so this is bulk preparation for the two callers that want a cache filled
 * before anybody waits on it: an e2e run that needs a topic already recorded,
 * and the mobile client downloading a topic before a journey. It is scoped to a
 * topic because both of those are, and because the whole curriculum was the
 * waste decision `0029` was written to end. See
 * docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
 *
 * Anything already recorded is skipped, so running it twice is cheap and
 * running it after an edit records only what changed.
 *
 * The parts of the engine are imported directly rather than through
 * `@/lib/speech`, whose `server-only` marker throws outside a server module.
 */
async function main() {
  const topic = await requested()
  const sections = topic.narration ?? []

  console.log(
    `recording ${topic.slug}: ${sections.length} sections and ${topic.questions.length} questions, into ${cacheDirectory()}, engine at ${process.env.SPEECH_SERVICE_URL ?? 'http://tts:5000'}`,
  )

  const tally = { recorded: 0, already: 0 }

  // One at a time throughout. The engine is a single container doing real work,
  // and a topic arriving at once would only make it slower.
  for (const [position, section] of sections.entries()) {
    await record(tally, section.script, `${position + 1}/${sections.length} ${section.title}`)
  }

  // A question is spoken from the words it already has rather than from a
  // script written for it, which is the opposite of how a lesson is narrated. A
  // question is a sentence somebody asks out loud; a lesson is a document. See
  // docs/decisions/0021-questions-are-spoken-from-built-audio.md.
  for (const question of topic.questions) {
    await record(tally, questionScript(question), `${question.id} question`)
    await record(tally, answerScript(question), `${question.id} answer`)
  }

  console.log(
    `${topic.slug} ready: ${tally.recorded} recorded, ${tally.already} already there, ${tally.recorded + tally.already} recordings in all`,
  )
}

/** The topic named on the command line, or an error saying how to name one. */
async function requested(): Promise<Topic> {
  const slug = process.argv[2]
  if (slug === undefined) {
    throw new Error('name the topic to record: npm run narration:build -- javascript/closures')
  }

  const [technology, directory] = slug.split('/')
  const topic = technology && directory ? await getTopic(technology, directory) : null

  if (!topic) {
    throw new Error(
      `no topic called "${slug}". A slug is technology/topic, as in javascript/closures`,
    )
  }

  return topic
}

type Tally = { recorded: number; already: number }

async function record(tally: Tally, script: string, what: string) {
  const { source } = await narrate(script)
  if (source === 'engine') {
    tally.recorded += 1
    console.log(`  recorded  ${what}`)
  } else {
    tally.already += 1
  }
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
