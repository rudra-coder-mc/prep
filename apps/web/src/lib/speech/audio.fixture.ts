/**
 * A recording's first bytes, for tests that put audio through code which checks
 * the format. Nothing here is playable: it is a header and the padding that
 * puts `OpusHead` where an Ogg page would.
 */
export function fakeOpus(...trailing: number[]): Uint8Array<ArrayBuffer> {
  const ascii = new TextEncoder()
  const bytes = new Uint8Array(36 + trailing.length)
  bytes.set(ascii.encode('OggS'), 0)
  bytes.set(ascii.encode('OpusHead'), 28)
  bytes.set(trailing, 36)
  return bytes
}
