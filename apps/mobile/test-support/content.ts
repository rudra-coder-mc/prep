import type { ArchiveContent, ArchiveQuestion, ArchiveTopic } from '@prep/content/archive/types'

/**
 * Archives small enough to read, for the tests that need content rather than a
 * database.
 *
 * The shapes are the build's, imported as types, so a fixture that stops
 * resembling a real archive fails the typecheck rather than passing a test the
 * phone would fail. Building a real one costs a Node filesystem and most of a
 * minute, which apps/web/src/app/api/device/device-client.integration.test.ts
 * already spends once.
 */

export function archiveQuestion(overrides: Partial<ArchiveQuestion> = {}): ArchiveQuestion {
  return {
    id: 'scope',
    type: 'concept',
    form: 'choice',
    tier: 'swe-1',
    prompt: 'What does the inner function keep?',
    options: ['The binding', 'A copy of the value'],
    correctOption: 0,
    answerInFull: 'It keeps the binding, so a later assignment is visible.',
    hints: [],
    tags: [],
    promptAudioKey: 'prompt-scope',
    answerAudioKey: 'answer-scope',
    ...overrides,
  }
}

export function archiveTopic(overrides: Partial<ArchiveTopic> = {}): ArchiveTopic {
  const technology = overrides.technology ?? 'javascript'
  const directory = overrides.directory ?? 'closures'

  return {
    slug: `${technology}/${directory}`,
    technology,
    directory,
    title: 'Closures',
    summary: 'What a function keeps hold of.',
    order: 0,
    tags: [],
    prerequisites: [],
    lesson: `lessons/${technology}/${directory}.html`,
    questions: [archiveQuestion()],
    exercises: [],
    narration: null,
    ...overrides,
  }
}

export function archiveContent(topics: ArchiveTopic[]): ArchiveContent {
  const technologies = new Map<string, string[]>()
  for (const topic of topics) {
    technologies.set(topic.technology, [...(technologies.get(topic.technology) ?? []), topic.slug])
  }

  return {
    version: 'test-archive',
    technologies: [...technologies].map(([id, slugs]) => ({ id, topics: slugs })),
    topics,
  }
}
