import { File, Paths } from 'expo-file-system'
import { recordingPath } from './library'

/**
 * Where a recording is, in the form the audio player takes.
 *
 * The player wants a URI and the file store works in paths relative to the
 * document directory, so this is the one place the two meet. It is here rather
 * than in ./library.ts because `Paths` is native and the library is what the
 * tests run.
 */
export function recordingUri(key: string): string {
  return new File(Paths.document, recordingPath(key)).uri
}
