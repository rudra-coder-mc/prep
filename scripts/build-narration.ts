import { getAllTopics, type Topic } from '@/content/loader'
import { cacheDirectory } from '@/lib/speech/cache'
import { narrate } from '@/lib/speech/narrate'
import { SpeechServiceError } from '@/lib/speech/piper'
import { answerScript, questionScript } from '@/lib/speech/spoken-question'

/**
 * Builds everything in `content/` that can be listened to, once.
 *
 * Two things: every narration section of every lesson, and, for every question,
 * one recording of the prompt and one of the answer with its explanation.
 *
 * All of it is static text, so there is no reason to synthesise it while
 * somebody is waiting. This turns the whole curriculum into files ahead of time
 * and the app never does the expensive part again. Anything that already has a
 * recording is skipped, so running this after adding one topic only builds that
 * topic.
 *
 * Nothing depends on this any more. A recording is made the first time it is
 * asked for, so this is bulk preparation: filling a cache before a journey, or
 * before an e2e run that wants one. See
 * docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
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

  const tally = { built: 0, already: 0 }

  for (const topic of spoken) {
    const sections = topic.narration ?? []

    // One at a time throughout. The engine is a single container doing real
    // work, and the whole curriculum arriving at once would only make it slower.
    for (const [position, section] of sections.entries()) {
      await record(
        tally,
        section.script,
        `${topic.slug} ${position + 1}/${sections.length} ${section.title}`,
      )
    }
  }

  console.log(
    `narration ready: ${tally.built} built, ${tally.already} already there, ${tally.built + tally.already} sections in all`,
  )

  await buildQuestions(topics)
}

/**
 * A question is spoken from the words it already has rather than from a script
 * written for it, which is the opposite of how a lesson is narrated. A question
 * is a sentence somebody asks out loud; a lesson is a document. See
 * docs/decisions/0021-questions-are-spoken-from-built-audio.md.
 */
async function buildQuestions(topics: Topic[]) {
  const total = topics.reduce((count, topic) => count + topic.questions.length, 0)
  console.log(`building audio for ${total} questions, two recordings each`)

  const tally = { built: 0, already: 0 }

  for (const topic of topics) {
    for (const question of topic.questions) {
      await record(tally, questionScript(question), `${topic.slug}#${question.id} question`)
      await record(tally, answerScript(question), `${topic.slug}#${question.id} answer`)
    }
  }

  console.log(
    `questions ready: ${tally.built} built, ${tally.already} already there, ${tally.built + tally.already} recordings in all`,
  )
}

type Tally = { built: number; already: number }

async function record(tally: Tally, script: string, what: string) {
  const { source } = await narrate(script)
  if (source === 'engine') {
    tally.built += 1
    console.log(`  built    ${what}`)
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
