/**
 * The protocol between a lesson page and the app showing it.
 *
 * A lesson is a pre-rendered page in a WebView with the player, the navigation
 * and everything else native around it, so two programs meet on one screen and
 * the seam between them is this. Both ends import this file: the page in
 * ./lesson-bridge.ts, the phone in apps/mobile/src/lesson/. Neither end can
 * rename a message without the other following. See
 * docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md.
 *
 * Four messages and no state. The app sends in the heading the narration is on
 * and the colours it drew the screen with; the page says when it is ready and
 * reports the links tapped in it. Nothing about progress, the session or the
 * archive crosses.
 *
 * This is a leaf on purpose. The phone imports it, so anything imported here is
 * imported onto the phone too.
 */

/** What the page posts back. */
export type LessonMessage = { type: 'ready' } | { type: 'link'; href: string }

/** The app's palette as CSS custom properties, applied to the page's root. */
export type LessonTheme = Record<string, string>

/** The name the page hangs its controls on, and the app calls them through. */
export const LESSON_CONTROLS = 'prepLesson'

/**
 * One call into the page.
 *
 * It ends in `true` because the WebView evaluates what it is given and reports
 * the result, and a result that is not a plain value warns. It is guarded
 * because injection is a race the app cannot otherwise win: a script can reach a
 * page that has reloaded and not mounted yet. Nothing is queued, since a page
 * that is ready says so and is sent what it needs then.
 */
function script(call: string): string {
  return `if (window.${LESSON_CONTROLS}) window.${LESSON_CONTROLS}.${call}; true;`
}

/** Lights up the section of the lesson the voice is on. Null clears the marking. */
export function sectionScript(slug: string | null): string {
  return script(`section(${JSON.stringify(slug)})`)
}

/** Hands the page the colours the native chrome around it is drawn with. */
export function themeScript(theme: LessonTheme): string {
  return script(`theme(${JSON.stringify(theme)})`)
}

/**
 * A message from the page, or null for anything that is not one. A WebView can
 * post whatever it likes, and the app has to be unbothered by whatever that is.
 */
export function parseLessonMessage(raw: string): LessonMessage | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const { type, href } = parsed as Record<string, unknown>

  if (type === 'ready') return { type: 'ready' }
  if (type === 'link' && typeof href === 'string' && href !== '') return { type: 'link', href }
  return null
}
