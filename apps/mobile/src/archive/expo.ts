import { Directory, File, Paths } from 'expo-file-system'
import type { FileStore } from './files'

/**
 * The device's filesystem, which is `expo-file-system` behind ./files.ts.
 *
 * Everything is relative to the document directory, which is the storage
 * Android does not reclaim when it is short of space. The archive is a
 * megabyte-sized download that the app cannot work without, so it does not
 * belong in the cache directory.
 */
export function createFileStore(): FileStore {
  const root = Paths.document
  const file = (path: string) => new File(root, path)
  const directory = (path: string) => new Directory(root, path)

  return {
    async writeBytes(path, bytes) {
      const target = file(path)
      target.create({ intermediates: true, overwrite: true })
      target.write(bytes)
    },
    async readText(path) {
      const target = file(path)
      if (!target.exists) return null
      return target.text()
    },
    async exists(path) {
      return file(path).exists || directory(path).exists
    },
    async makeDirectory(path) {
      directory(path).create({ intermediates: true, idempotent: true })
    },
    async remove(path) {
      const asDirectory = directory(path)
      if (asDirectory.exists) {
        asDirectory.delete()
        return
      }
      const asFile = file(path)
      if (asFile.exists) asFile.delete()
    },
    async list(path) {
      const target = directory(path)
      if (!target.exists) return []
      return target.list().map((entry) => entry.name)
    },
  }
}
