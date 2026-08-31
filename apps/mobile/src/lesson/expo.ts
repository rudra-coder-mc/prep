import { File, Paths } from 'expo-file-system'

/**
 * Where a lesson page is, in the form the WebView takes.
 *
 * It is here rather than in ./page.ts for the reason ../audio/expo.ts exists:
 * `Paths` is native, and the module the tests run has to work without it.
 */
export function lessonUri(path: string): string {
  return new File(Paths.document, path).uri
}
