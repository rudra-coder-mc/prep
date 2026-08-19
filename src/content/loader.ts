import { readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { Exercise, Question, TopicMeta } from './schema'
import { validateTopic } from './validate'

const CONTENT_ROOT = path.join(process.cwd(), 'content')

export type Topic = TopicMeta & {
  /** `technology/topic`, the identity used everywhere in the database. */
  slug: string
  technology: string
  /** The directory name, which is also the second URL segment. */
  directory: string
  questions: Question[]
  exercises: Exercise[]
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

async function loadTopic(technology: string, directory: string): Promise<Topic> {
  const base = `content/${technology}/${directory}`

  const [metaModule, questionsModule, exercisesModule] = await Promise.all([
    import(`../../content/${technology}/${directory}/meta`),
    import(`../../content/${technology}/${directory}/questions`),
    import(`../../content/${technology}/${directory}/exercises`),
  ])

  const { meta, questions, exercises } = validateTopic(
    {
      meta: metaModule.meta,
      questions: questionsModule.questions,
      exercises: exercisesModule.exercises,
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

export function listTechnologies(): string[] {
  return directoriesIn(CONTENT_ROOT)
}
