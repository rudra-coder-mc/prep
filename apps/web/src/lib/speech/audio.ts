/**
 * A recording, held as bytes.
 *
 * Recordings are Ogg Opus at 32 kbps mono. See
 * docs/decisions/0036-recordings-are-stored-compressed.md.
 *
 * The `ArrayBuffer` parameter is not decoration. A bare `Uint8Array` is backed
 * by `ArrayBufferLike`, which includes `SharedArrayBuffer`, and that is not a
 * valid `Response` body. Widening this alias fails the build at the route.
 */
export type Audio = Uint8Array<ArrayBuffer>

const OGG_PAGE = 'OggS'
const OPUS_HEAD = 'OpusHead'

/** Where the first packet of the first Ogg page begins, for a one-segment page. */
const FIRST_PACKET = 28

/**
 * Whether the bytes are an Ogg stream whose first packet identifies as Opus.
 *
 * This has to be checked somewhere. The engine is a Flask app, and a Flask app
 * that fails serves an HTML page: without this, the error page is what gets
 * written to the cache under the key of the script that failed, and it plays as
 * silence forever after.
 */
export function isOggOpus(audio: Uint8Array): boolean {
  const ascii = new TextDecoder('ascii')
  return (
    ascii.decode(audio.subarray(0, OGG_PAGE.length)) === OGG_PAGE &&
    ascii.decode(audio.subarray(FIRST_PACKET, FIRST_PACKET + OPUS_HEAD.length)) === OPUS_HEAD
  )
}
