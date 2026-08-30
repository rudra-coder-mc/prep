import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { archiveContent, type ArchiveContent } from './data'
import { buildLessons } from './lessons'
import {
  ARCHIVE_FILE,
  archiveDirectory,
  CONTENT_FILE,
  LESSONS_DIR,
  MANIFEST_FILE,
} from './location'
import type { ArchiveManifest } from './manifest'
import { writeArchiveZip } from './zip'

/**
 * Writing the archive: the content as one JSON file, one pre-rendered page per
 * topic, and a manifest naming the version and everything in it.
 *
 * It is replaced whole rather than in parts. A device that half-refreshed would
 * be holding questions from one version and lesson pages from another, and
 * nothing downstream could tell. See docs/glossary.md.
 */

export type BuiltArchive = {
  directory: string
  manifest: ArchiveManifest
  content: ArchiveContent
  lessonBytes: number
}

/** Everything a build ever puts at the top level of its output directory. */
const OURS = new Set([CONTENT_FILE, MANIFEST_FILE, LESSONS_DIR, ARCHIVE_FILE])

function counts(content: ArchiveContent) {
  return {
    topics: content.topics.length,
    questions: content.topics.reduce((total, topic) => total + topic.questions.length, 0),
    exercises: content.topics.reduce((total, topic) => total + topic.exercises.length, 0),
    narrationSections: content.topics.reduce(
      (total, topic) => total + (topic.narration?.length ?? 0),
      0,
    ),
  }
}

/**
 * Emptying the output directory, which is the one destructive thing this does.
 *
 * The directory can be named on the command line, so it refuses anything that is
 * neither empty nor an archive it wrote itself. A mistyped path should cost an
 * error rather than whatever was in it.
 */
async function emptyOutput(directory: string): Promise<void> {
  if (existsSync(directory)) {
    // Judged on everything present rather than on the manifest, because a build
    // that failed partway wrote pages and no manifest, and refusing to clean that
    // up would leave the next run stuck on the mess the last one made.
    const strangers = (await readdir(directory)).filter((entry) => !OURS.has(entry))
    if (strangers.length > 0) {
      throw new Error(
        `${directory} holds ${strangers.join(', ')}, which no archive build wrote. Refusing to delete it`,
      )
    }
    await rm(directory, { recursive: true, force: true })
  }

  await mkdir(directory, { recursive: true })
}

/**
 * The whole archive, from `content/` to a directory a device can be handed.
 *
 * The directory is emptied first. A build that wrote over the last one would
 * leave the pages of deleted topics behind, and those would then be listed by a
 * manifest that no longer mentions them.
 */
export async function buildArchive(directory = archiveDirectory()): Promise<BuiltArchive> {
  const content = await archiveContent()

  await emptyOutput(directory)

  const lessons = await buildLessons(content.topics, directory)

  await writeFile(path.join(directory, CONTENT_FILE), JSON.stringify(content))

  const files = [CONTENT_FILE, ...lessons.files].sort()

  // Packed before the manifest is written, so a manifest on disk is always a
  // promise the archive beside it can keep. A build interrupted here leaves no
  // manifest, and the server reads that as nothing to serve rather than as a
  // version it cannot deliver.
  const bytes = await writeArchiveZip(directory, files)

  const manifest: ArchiveManifest = {
    version: content.version,
    ...counts(content),
    files,
    archive: { file: ARCHIVE_FILE, bytes },
  }
  await writeFile(path.join(directory, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + '\n')

  return { directory, manifest, content, lessonBytes: lessons.bytes }
}
