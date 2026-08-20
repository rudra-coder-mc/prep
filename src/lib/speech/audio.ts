/**
 * A WAV recording, held as bytes.
 *
 * The `ArrayBuffer` parameter is not decoration. A bare `Uint8Array` is backed
 * by `ArrayBufferLike`, which includes `SharedArrayBuffer`, and that is not a
 * valid `Response` body. Widening this alias fails the build at the route.
 */
export type Audio = Uint8Array<ArrayBuffer>

/**
 * Whether the bytes start `RIFF....WAVE`.
 *
 * This has to be checked somewhere: Piper answers with an HTML content type even
 * when the body is audio, so its recordings and its Flask error pages are
 * indistinguishable by header alone.
 */
export function isWav(audio: Uint8Array): boolean {
  const header = new TextDecoder('ascii').decode(audio.subarray(0, 12))
  return header.startsWith('RIFF') && header.endsWith('WAVE')
}
