import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { FileStore } from '../src/archive/files'

/**
 * The same file interface over a real directory, so an install test writes real
 * files into real nested directories rather than into a map that cannot fail
 * the way a filesystem does.
 *
 * It is outside src/ for the reason ./database.ts is: it runs on Node, and the
 * app is typechecked without Node types so that it cannot.
 */
export async function createTestFileStore(): Promise<FileStore & { root: string }> {
  const root = await mkdtemp(path.join(tmpdir(), 'prep-archive-'))
  const resolve = (relative: string) => path.join(root, relative)

  return {
    root,
    async writeBytes(relative, bytes) {
      await writeFile(resolve(relative), bytes)
    },
    async readText(relative) {
      try {
        return await readFile(resolve(relative), 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw error
      }
    },
    async exists(relative) {
      try {
        await readFile(resolve(relative))
        return true
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        // A directory is a thing that exists and is not a file to read.
        if (code === 'EISDIR') return true
        if (code === 'ENOENT') return false
        throw error
      }
    },
    async makeDirectory(relative) {
      await mkdir(resolve(relative), { recursive: true })
    },
    async remove(relative) {
      await rm(resolve(relative), { recursive: true, force: true })
    },
    async list(relative) {
      try {
        return await readdir(resolve(relative))
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw error
      }
    },
  }
}
