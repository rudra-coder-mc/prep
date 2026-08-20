import type { Page } from '@playwright/test'

/**
 * What a request for narration looks like from inside the page.
 *
 * This goes through the browser's own `fetch` rather than Playwright's request
 * fixture on purpose. The player will call the endpoint exactly this way, with
 * the session cookie the page already has and with redirects followed silently,
 * and it is the silent following that has bitten this endpoint before: a
 * redirect to the login page answers a request for audio with a page of HTML and
 * a 200 that no assertion about "did it work" would have caught.
 */
export type SpokenResponse = {
  status: number
  contentType: string | null
  cache: string | null
  cacheControl: string | null
  key: string | null
  byteLength: number
  /** The first twelve bytes as ASCII, which is where a WAV says `RIFF....WAVE`. */
  header: string
}

export async function speak(page: Page, text: string): Promise<SpokenResponse> {
  return page.evaluate(async (script) => {
    const response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: script }),
    })

    const bytes = new Uint8Array(await response.arrayBuffer())

    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      cache: response.headers.get('x-speech-cache'),
      cacheControl: response.headers.get('cache-control'),
      key: response.headers.get('x-speech-key'),
      byteLength: bytes.byteLength,
      header: new TextDecoder('ascii').decode(bytes.subarray(0, 12)),
    }
  }, text)
}

/**
 * What asking for a recording that was built ahead of time looks like from
 * inside the page. This is the request the player makes first, and the one it
 * makes for every section once `npm run narration:build` has run.
 */
export async function playBuilt(page: Page, key: string): Promise<SpokenResponse> {
  return page.evaluate(async (address) => {
    const response = await fetch(`/api/speech/${address}`)
    const bytes = new Uint8Array(await response.arrayBuffer())

    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      cache: response.headers.get('x-speech-cache'),
      cacheControl: response.headers.get('cache-control'),
      key: address,
      byteLength: bytes.byteLength,
      header: new TextDecoder('ascii').decode(bytes.subarray(0, 12)),
    }
  }, key)
}
