import { readFile } from 'node:fs/promises'
import { getAllTopics, topicFile, type Topic } from '@prep/content'
import {
  collidingHeadings,
  unknownHeadings,
  TIER_LABELS,
  TIERS,
  checkScript,
  MAX_SCRIPT_LENGTH,
} from '@prep/core'
import { answerScript, questionScript } from '../apps/web/src/lib/speech/spoken-question'

/**
 * Runs before the build so malformed content fails there rather than during a
 * study session. Topic pages are rendered on demand, so nothing else would
 * catch it.
 */
async function main() {
  const topics = await getAllTopics()
  const questions = topics.reduce((total, topic) => total + topic.questions.length, 0)
  const exercises = topics.reduce((total, topic) => total + topic.exercises.length, 0)
  const spoken = topics.filter((topic) => topic.narration !== null)
  console.log(`content ok: ${topics.length} topics, ${questions} questions, ${exercises} exercises`)

  // Narration is optional, so a topic silently losing its player would not fail
  // anything. Naming the ones without a script is how that stays visible.
  const silent = topics.filter((topic) => topic.narration === null).map((topic) => topic.slug)
  console.log(
    silent.length === 0
      ? `narration: all ${spoken.length} topics have a script`
      : `narration: ${spoken.length} of ${topics.length} topics have a script, missing ${silent.join(', ')}`,
  )

  // The schema demands a tier, so there is nothing here to fail on. What the
  // count is for is authoring: a tier the bank is thin at is the one Phase 4
  // fills, and reading it off the files beats deriving it by hand per batch.
  const perTier = TIERS.map(
    (tier) =>
      `${TIER_LABELS[tier]} ${topics.reduce((total, topic) => total + topic.questions.filter((question) => question.tier === tier).length, 0)}`,
  )
  console.log(`tiers: ${questions} questions, ${perTier.join(', ')}`)

  await checkNarrationAnchors(spoken)
  checkQuestionScripts(topics)
}

/**
 * Every question is read aloud from the words it already carries, and the engine
 * speaks one request at a time up to a fixed length. A prompt or an explanation
 * that grows past it would fail partway through the next narration build, which
 * is a long way from where the mistake was made.
 */
function checkQuestionScripts(topics: Topic[]) {
  const failures: string[] = []
  let scripts = 0

  for (const topic of topics) {
    for (const question of topic.questions) {
      for (const [kind, script] of [
        ['question', questionScript(question)],
        ['answer', answerScript(question)],
      ] as const) {
        scripts += 1
        const problem = checkScript(script)
        if (problem === 'empty') {
          failures.push(`${topic.slug}#${question.id}: the ${kind} has nothing speakable in it`)
        } else if (problem === 'too-long') {
          failures.push(
            `${topic.slug}#${question.id}: the ${kind} is ${script.length} characters spoken, over the ${MAX_SCRIPT_LENGTH} the engine takes in one request`,
          )
        }
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`question audio:\n  ${failures.join('\n  ')}`)
  }

  console.log(`question audio: all ${scripts} scripts are short enough to be spoken`)
}

/**
 * Every narration section says which lesson heading it is talking about, and the
 * page highlights that part of the lesson while the section plays. A heading
 * renamed on one side and not the other breaks that quietly - the audio still
 * plays, the lesson just stops following - so it is checked here.
 *
 * This lives in the script rather than in the schema because it is the one
 * content rule that is about two files agreeing, and the schema validates a
 * narration without ever seeing the lesson.
 */
async function checkNarrationAnchors(spoken: Topic[]) {
  const failures: string[] = []

  for (const topic of spoken) {
    const lesson = await readFile(
      topicFile(topic.technology, topic.directory, 'lesson.mdx'),
      'utf8',
    )

    for (const colliding of collidingHeadings(lesson)) {
      failures.push(
        `${topic.slug}: lesson.mdx has ${colliding.length} headings that render with the same id, ${colliding.map((heading) => `"${heading}"`).join(' and ')}`,
      )
    }

    for (const { heading, suggestion } of unknownHeadings(
      (topic.narration ?? []).map((section) => section.heading),
      lesson,
    )) {
      failures.push(
        `${topic.slug}: narration points at the heading "${heading}", which lesson.mdx does not have` +
          (suggestion ? `. Did you mean "${suggestion}"?` : ''),
      )
    }
  }

  if (failures.length > 0) {
    throw new Error(`narration headings:\n  ${failures.join('\n  ')}`)
  }

  const sections = spoken.reduce((total, topic) => total + (topic.narration?.length ?? 0), 0)
  console.log(`narration headings: all ${sections} sections point at a heading their lesson has`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
