import type { LessonTheme } from '@prep/content/archive/bridge'
import { colors } from '../ui/theme'

/**
 * The palette the app draws with, in the form the lesson page takes.
 *
 * The page carries the web app's stylesheet, so it already has these colours in
 * it. Sending them anyway is what stops the seam showing: the WebView and the
 * native chrome around it are painted from one set of values at runtime rather
 * than from two copies that agree until one of them is edited.
 *
 * Derived rather than written out, so a colour added to the palette is sent
 * without anybody remembering to add it here.
 */
export function lessonTheme(palette: Record<string, string> = colors): LessonTheme {
  return Object.fromEntries(
    Object.entries(palette).map(([name, value]) => [`--color-${kebab(name)}`, value]),
  )
}

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
