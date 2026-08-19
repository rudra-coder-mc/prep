/**
 * The two ways to use prep. Interview is the product; learning is declared and
 * unbuilt, because something planned should look planned rather than absent.
 *
 * See docs/decisions/0010-interview-prep-focus.md.
 */
export type ModeId = 'interview' | 'learning'

export type Mode = {
  id: ModeId
  href: '/' | '/learn'
  label: string
}

export const MODES: Mode[] = [
  { id: 'interview', href: '/', label: 'Interview' },
  { id: 'learning', href: '/learn', label: 'Learning' },
]

/**
 * Derived from the URL rather than stored, so the switch cannot disagree with
 * the page you are actually on and there is no state to persist.
 */
export function activeMode(pathname: string): ModeId {
  if (pathname === '/learn' || pathname.startsWith('/learn/')) return 'learning'
  return 'interview'
}
