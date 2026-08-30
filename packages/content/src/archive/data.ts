import { getAllTopics, listTechnologies, type Topic } from '../loader'
import { answerAudioKey, questionAudioKey, scriptKey } from './audio-keys'
import { lessonPagePath, type ArchiveContent, type ArchiveTopic } from './types'
import { contentVersion } from './version'

/**
 * Turning `content/` into the archive a device is handed. The shapes it
 * produces are in ./types.ts, which is a leaf so that the phone can import them
 * without importing a filesystem.
 */

export type {
  ArchiveContent,
  ArchiveNarrationSection,
  ArchiveQuestion,
  ArchiveTopic,
} from './types'
export { lessonPagePath } from './types'

function archiveTopic(topic: Topic): ArchiveTopic {
  const { questions, exercises, narration, ...meta } = topic

  return {
    ...meta,
    lesson: lessonPagePath(topic.technology, topic.directory),
    questions: questions.map((question) => ({
      ...question,
      promptAudioKey: questionAudioKey(question),
      answerAudioKey: answerAudioKey(question),
    })),
    exercises,
    narration:
      narration === null
        ? null
        : narration.map((section) => ({ ...section, audioKey: scriptKey(section.script) })),
  }
}

export async function archiveContent(): Promise<ArchiveContent> {
  const [topics, version] = await Promise.all([getAllTopics(), contentVersion()])
  const built = topics.map(archiveTopic)

  return {
    version,
    technologies: listTechnologies().map((id) => ({
      id,
      topics: built.filter((topic) => topic.technology === id).map((topic) => topic.slug),
    })),
    topics: built,
  }
}
