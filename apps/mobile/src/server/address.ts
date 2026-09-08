/**
 * The one address the app talks to, which is whichever machine is serving the
 * stack: the local desktop machine running Docker on the local network / Wi-Fi.
 * It is typed in rather than compiled in, because changing it otherwise means
 * another APK. See docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */

/**
 * A typed address as an origin, or null when it is not one.
 *
 * Everything is stored as an origin so that endpoints can be named relative to
 * it without either side worrying about a slash. Local IPs and localhost default
 * to http://, while other bare hostnames default to https://.
 */
export function serverAddress(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  let withScheme: string
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    withScheme = trimmed
  } else if (/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|localhost)(:\d+)?(\/.*)?$/i.test(trimmed)) {
    withScheme = `http://${trimmed}`
  } else {
    withScheme = `https://${trimmed}`
  }

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
