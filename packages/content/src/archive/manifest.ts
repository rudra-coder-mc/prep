import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { MANIFEST_FILE } from './location'

/**
 * What a build says it wrote, and the one definition of it.
 *
 * The build writes this file and the server answers a device out of it, so the
 * shape is described once and parsed on the way in. A manifest is a promise that
 * the archive beside it can be delivered, and half a manifest is a promise that
 * cannot be kept: a device would be told a version and then handed nothing for
 * it, and would go on asking.
 */
const ManifestSchema = z.object({
  /** A hash of the files the archive was built from. See ./version.ts. */
  version: z.string().min(1),
  topics: z.number().int().nonnegative(),
  questions: z.number().int().nonnegative(),
  exercises: z.number().int().nonnegative(),
  narrationSections: z.number().int().nonnegative(),
  /** What is inside the artefact, for a build log and for a device to check a download. */
  files: z.array(z.string()),
  /** The one file a device downloads, holding everything `files` names. */
  archive: z.object({ file: z.string().min(1), bytes: z.number().int().nonnegative() }),
})

export type ArchiveManifest = z.infer<typeof ManifestSchema>

/**
 * The manifest in an archive directory, or null when there is no usable one.
 *
 * Nothing built and something half written are the same answer here, because
 * the server can do the same thing about either: say it has nothing to serve.
 * A file that is there and unreadable is logged, since that one is a machine
 * somebody has to go and look at.
 */
export async function readManifest(directory: string): Promise<ArchiveManifest | null> {
  let raw: string
  try {
    raw = await readFile(path.join(directory, MANIFEST_FILE), 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }

  try {
    return ManifestSchema.parse(JSON.parse(raw))
  } catch (error) {
    console.error(`the archive manifest in ${directory} could not be read`, error)
    return null
  }
}
