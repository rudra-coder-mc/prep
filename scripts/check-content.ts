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
  console.log(`content ok: ${topics.length} topics, ${questions} questions, ${exercises} exercises`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
