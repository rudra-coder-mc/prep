import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getAllTopics, type Topic } from '@/content/loader'
import { collidingHeadings, unknownHeadings } from '@/content/headings'

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

  await checkNarrationAnchors(spoken)
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
      path.join(process.cwd(), 'content', topic.technology, topic.directory, 'lesson.mdx'),
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
