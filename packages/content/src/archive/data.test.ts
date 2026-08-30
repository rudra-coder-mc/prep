import { describe, expect, it } from 'vitest'
import { getAllTopics, listTechnologies } from '../loader'
import { archiveContent, lessonPagePath } from './data'
import { answerAudioKey, questionAudioKey, scriptKey } from './audio-keys'

/**
 * The archive is the whole of what a device knows, so the thing worth asserting
 * is that it holds everything `content/` holds. A topic, a question or an
 * exercise the archive quietly drops is a gap nobody sees until a phone with no
 * signal reaches it.
 *
 * These read the real curriculum rather than a fixture on purpose. A fixture
 * would prove the shape and not the agreement, and the agreement is the point.
 */
describe('archiveContent', () => {
  it('carries every topic the loader reports, in the same order', async () => {
    const content = await archiveContent()
    const topics = await getAllTopics()

    expect(content.topics.map((topic) => topic.slug)).toEqual(topics.map((topic) => topic.slug))
  })

  it('carries every question, exercise and narration section', async () => {
    const content = await archiveContent()
    const topics = await getAllTopics()
    const questions = (rows: { questions: unknown[] }[]) =>
      rows.reduce((total, row) => total + row.questions.length, 0)
    const exercises = (rows: { exercises: unknown[] }[]) =>
      rows.reduce((total, row) => total + row.exercises.length, 0)
    const sections = (rows: { narration: unknown[] | null }[]) =>
      rows.reduce((total, row) => total + (row.narration?.length ?? 0), 0)

    expect(questions(content.topics)).toBe(questions(topics))
    expect(exercises(content.topics)).toBe(exercises(topics))
    expect(sections(content.topics)).toBe(sections(topics))
  })

  it('names every technology, with the topics that belong to it', async () => {
    const content = await archiveContent()

    expect(content.technologies.map((technology) => technology.id)).toEqual(listTechnologies())
    for (const technology of content.technologies) {
      expect(technology.topics.length).toBeGreaterThan(0)
      for (const slug of technology.topics) expect(slug.startsWith(`${technology.id}/`)).toBe(true)
    }
  })

  it('carries every question in full, answer included, because the phone grades alone', async () => {
    const content = await archiveContent()

    for (const topic of content.topics) {
      for (const question of topic.questions) {
        expect(question.answerInFull.length).toBeGreaterThan(0)
        if (question.form === 'choice') expect(question.correctOption).toBeTypeOf('number')
        if (question.form === 'ordering') expect(question.correctOrder?.length).toBeGreaterThan(0)
      }
    }
  })

  it('addresses a question prompt and answer the way the cache stores them', async () => {
    const content = await archiveContent()
    const topics = await getAllTopics()
    const source = topics[0]?.questions[0]
    const built = content.topics[0]?.questions[0]

    expect(source).toBeDefined()
    expect(built?.promptAudioKey).toBe(questionAudioKey(source!))
    expect(built?.answerAudioKey).toBe(answerAudioKey(source!))
  })

  it('addresses every narration section the way the cache stores it', async () => {
    const content = await archiveContent()
    const spoken = content.topics.find((topic) => topic.narration !== null)
    const section = spoken?.narration?.[0]

    expect(section).toBeDefined()
    expect(section?.audioKey).toBe(scriptKey(section!.script))
  })

  it('gives every question and section an audio key', async () => {
    const content = await archiveContent()
    const isKey = (key: string) => /^[0-9a-f]{64}$/.test(key)

    for (const topic of content.topics) {
      for (const question of topic.questions) {
        expect(isKey(question.promptAudioKey)).toBe(true)
        expect(isKey(question.answerAudioKey)).toBe(true)
      }
      for (const section of topic.narration ?? []) expect(isKey(section.audioKey)).toBe(true)
    }
  })

  it('points every topic at the lesson page built for it', async () => {
    const content = await archiveContent()

    for (const topic of content.topics) {
      expect(topic.lesson).toBe(lessonPagePath(topic.technology, topic.directory))
    }
  })

  it('carries a version', async () => {
    expect((await archiveContent()).version).toMatch(/^[0-9a-f]{16}$/)
  })
})

describe('lessonPagePath', () => {
  it('is a relative path inside the archive, so a device joins it to its own directory', () => {
    expect(lessonPagePath('javascript', 'closures')).toBe('lessons/javascript/closures.html')
  })
})
