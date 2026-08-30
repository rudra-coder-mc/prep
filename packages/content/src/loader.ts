import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { Exercise, Narration, Question, TopicMeta } from '@prep/core'
import { validateTopic } from './validate'

/**
 * The curriculum's directory, found by walking up from wherever the caller
 * started. The web app runs from apps/web, the scripts run from the repository
 * root and the built server runs from the image's root, so a path relative to
 * any one of them is wrong for the other two. `import.meta.dirname` would be
 * exact but is undefined once a bundler has compiled this file.
 */
function findContentRoot(): string {
  let dir = process.cwd()
  for (;;) {
    const candidate = path.join(dir, 'packages', 'content', 'content')
    if (existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) throw new Error('no packages/content/content above ' + process.cwd())
    dir = parent
  }
}

const CONTENT_ROOT = findContentRoot()

export type Topic = TopicMeta & {
  /** `technology/topic`, the identity used everywhere in the database. */
  slug: string
  technology: string
  /** The directory name, which is also the second URL segment. */
  directory: string
  questions: Question[]
  exercises: Exercise[]
  /** Null when the topic has no narration.ts, in which case it shows no player. */
  narration: Narration | null
}

export type Technology = {
  id: string
  topics: Topic[]
}

function directoriesIn(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

/**
 * Narration is optional, and asking the filesystem first is what makes it
 * optional: importing a path the bundler has no module for rejects, where a
 * missing file should just mean "this topic is not spoken yet".
 */
async function loadNarration(technology: string, directory: string): Promise<unknown> {
  const file = path.join(CONTENT_ROOT, technology, directory, 'narration.ts')
  if (!existsSync(file)) return undefined

  const loaded = await import(`../content/${technology}/${directory}/narration`)
  return loaded.narration
}

async function loadTopic(technology: string, directory: string): Promise<Topic> {
  const base = `content/${technology}/${directory}`

  const [metaModule, questionsModule, exercisesModule, rawNarration] = await Promise.all([
    import(`../content/${technology}/${directory}/meta`),
    import(`../content/${technology}/${directory}/questions`),
    import(`../content/${technology}/${directory}/exercises`),
    loadNarration(technology, directory),
  ])

  const { meta, questions, exercises, narration } = validateTopic(
    {
      meta: metaModule.meta,
      questions: questionsModule.questions,
      exercises: exercisesModule.exercises,
      narration: rawNarration,
    },
    directory,
    base,
  )

  return {
    ...meta,
    slug: `${technology}/${directory}`,
    technology,
    directory,
    questions,
    exercises,
    narration,
  }
}

export async function getTechnology(technology: string): Promise<Technology> {
  const directories = directoriesIn(path.join(CONTENT_ROOT, technology))
  const topics = await Promise.all(directories.map((dir) => loadTopic(technology, dir)))
  topics.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  return { id: technology, topics }
}

export async function getTopic(technology: string, directory: string): Promise<Topic | null> {
  if (!existsSync(path.join(CONTENT_ROOT, technology, directory))) return null
  return loadTopic(technology, directory)
}

export async function getAllTopics(): Promise<Topic[]> {
  const technologies = directoriesIn(CONTENT_ROOT)
  const loaded = await Promise.all(technologies.map((id) => getTechnology(id)))
  return loaded.flatMap((tech) => tech.topics)
}

/**
 * The absolute path of a file sitting beside a topic, such as its lesson. The
 * package knows where the curriculum is; nothing outside it should rebuild that
 * path from the working directory.
 */
export function topicFile(technology: string, directory: string, file: string): string {
  return path.join(CONTENT_ROOT, technology, directory, file)
}

export function listTechnologies(): string[] {
  return directoriesIn(CONTENT_ROOT)
}

/**
 * Where the curriculum is. The archive build hashes every file under it, which
 * is the one thing that needs the directory itself rather than a path inside it.
 */
export function contentRoot(): string {
  return CONTENT_ROOT
}

/**
 * Resolves scheduled question keys back to their content. Keys that no longer
 * exist are dropped rather than throwing, because deleting a topic leaves
 * schedule rows behind by design.
 */
export async function getQuestionsByKeys(
  keys: string[],
): Promise<{ topic: Topic; question: Question }[]> {
  const topicSlugs = [...new Set(keys.map((key) => key.split('#')[0] ?? ''))].filter(Boolean)

  const topics = await Promise.all(
    topicSlugs.map(async (slug) => {
      const [technology, directory] = slug.split('/')
      if (!technology || !directory) return null
      return getTopic(technology, directory)
    }),
  )

  const bySlug = new Map(
    topics.filter((topic) => topic !== null).map((topic) => [topic.slug, topic]),
  )

  return keys.flatMap((key) => {
    const [slug, questionId] = key.split('#')
    const topic = slug ? bySlug.get(slug) : undefined
    const question = topic?.questions.find((candidate) => candidate.id === questionId)
    return topic && question ? [{ topic, question }] : []
  })
}
