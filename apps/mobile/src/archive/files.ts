/**
 * The filesystem as the app sees it. Paths are relative to a root the
 * implementation owns, which on the phone is the app's document directory.
 *
 * It exists for the reason ../db/sqlite.ts exists: `expo-file-system` is behind
 * it on the device and `node:fs` is behind it in a test, so what a test proves
 * about unpacking an archive is what the phone does with one.
 */
export type FileStore = {
  writeBytes(path: string, bytes: Uint8Array): Promise<void>
  readText(path: string): Promise<string | null>
  exists(path: string): Promise<boolean>
  /** How many bytes a file holds, or null when it is not there. */
  size(path: string): Promise<number | null>
  /** Creates parents too, and does nothing when the directory is already there. */
  makeDirectory(path: string): Promise<void>
  /** Removes a directory and everything in it. A path that is not there is not an error. */
  remove(path: string): Promise<void>
  /** The names directly inside a directory. Empty for a directory that is not there. */
  list(path: string): Promise<string[]>
}
