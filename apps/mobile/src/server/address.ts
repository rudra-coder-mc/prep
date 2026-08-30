/**
 * The one address the app talks to, which is whichever machine is serving the
 * stack: the laptop while the laptop is it, the tailnet hostname once the spare
 * machine is running again. It is typed in rather than compiled in, because
 * changing it otherwise means another APK. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */

/**
 * A typed address as an origin, or null when it is not one.
 *
 * Everything is stored as an origin so that endpoints can be named relative to
 * it without either side worrying about a slash. A hostname with no scheme is
 * assumed to be https, which is what the tailnet serves and what a phone
 * keyboard makes it tempting to leave out.
 */
export function serverAddress(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }

  // A hostname is the whole point of the address, and URL parses "https://" into
  // one with an empty host rather than refusing it.
  if (url.hostname === '') return null
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null

  return url.origin
}
