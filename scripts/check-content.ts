import { getAllTopics } from '@/content/loader'

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
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
