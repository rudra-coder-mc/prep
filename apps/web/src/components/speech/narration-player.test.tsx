import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpokenSection } from './narration-audio'
import { NarrationProvider } from './narration-player'
import { TopicReader } from './topic-reader'

const SECTIONS: SpokenSection[] = [
  {
    title: 'Why this matters',
    heading: 'Why this matters',
    key: 'first',
  },
  {
    title: 'The idea',
    heading: 'The idea',
    key: 'second',
  },
  {
    title: 'The interview angle',
    heading: 'The interview angle',
    key: 'last',
  },
]

let play: ReturnType<typeof vi.fn<() => Promise<void>>>
let pause: ReturnType<typeof vi.fn<() => void>>
let created: number

/**
 * jsdom implements neither media playback nor object URLs, so both are stubbed
 * to the smallest thing that still lets the player's own logic be observed:
 * which section was fetched, what the element was pointed at, and whether play
 * was asked for.
 */
beforeEach(() => {
  created = 0
  play = vi.fn<() => Promise<void>>(async () => undefined)
  pause = vi.fn<() => void>()

  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(pause)

  URL.createObjectURL = vi.fn(() => `blob:section-${created++}`)
  URL.revokeObjectURL = vi.fn()

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('RIFF....WAVE', { headers: { 'Content-Type': 'audio/wav' } })),
  )
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

/**
 * Which sections were fetched to be played, in order. A section is named by its
 * key rather than by the script that would have to be synthesised without one.
 *
 * Warming goes to a different address and carries no audio, so it is not one of
 * these: what these assert on is the player asking for bytes it means to play.
 */
const requestedSections = () =>
  vi
    .mocked(fetch)
    .mock.calls.map(([url]) => String(url))
    .filter((url) => url !== WARM)
    .map((url) => url.replace('/api/speech/', ''))

const WARM = '/api/speech/warm'

/** What the page asked to have recorded ahead of anybody pressing play. */
const warmed = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([url]) => String(url) === WARM)
    .map(([, init]) => JSON.parse(String((init as RequestInit).body)))

/**
 * The card is the player's face, so driving the player through it is what these
 * assert on. Everything the buttons reach lives in the provider.
 */
function renderPlayer(sections: SpokenSection[], title: string) {
  return render(
    <NarrationProvider sections={sections} title={title}>
      <TopicReader />
    </NarrationProvider>,
  )
}

const audioIn = (container: HTMLElement) =>
  container.querySelector('audio') as HTMLAudioElement | null

describe('the narration player', () => {
  it('shows where the listener is before anything is played', () => {
    renderPlayer(SECTIONS, 'Closures')

    expect(screen.getByText('Why this matters')).toBeDefined()
    expect(screen.getByText('1 of 3')).toBeDefined()
  })

  it('plays the first section on the first press', async () => {
    const { container } = renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalled())
    expect(requestedSections()[0]).toBe('first')
    expect(audioIn(container)?.src).toContain('blob:section-0')
  })

  it('fetches the next section while the current one plays', async () => {
    renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(requestedSections()).toHaveLength(2))
    expect(requestedSections()[1]).toBe('second')
  })

  it('moves to the next section by itself when one ends', async () => {
    const { container } = renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(play).toHaveBeenCalled())

    const audio = audioIn(container)
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(screen.getByText('The idea')).toBeDefined())
    expect(screen.getByText('2 of 3')).toBeDefined()
  })

  it('stops at the end rather than looping', async () => {
    const { container } = renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Next section'))
    await userEvent.click(screen.getByLabelText('Next section'))
    await waitFor(() => expect(screen.getByText('3 of 3')).toBeDefined())

    const audio = audioIn(container)
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(screen.getByLabelText('Play narration')).toBeDefined())
    expect(screen.getByText('3 of 3')).toBeDefined()
  })

  it('will not step past either end', async () => {
    renderPlayer(SECTIONS, 'Closures')

    expect(screen.getByLabelText('Previous section')).toHaveProperty('disabled', true)

    await userEvent.click(screen.getByLabelText('Next section'))
    await userEvent.click(screen.getByLabelText('Next section'))

    await waitFor(() =>
      expect(screen.getByLabelText('Next section')).toHaveProperty('disabled', true),
    )
  })

  it('resumes where it paused instead of asking for the audio again', async () => {
    renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    const fetchedWhilePlaying = requestedSections().length

    await userEvent.click(screen.getByLabelText('Pause narration'))
    expect(pause).toHaveBeenCalled()

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
    expect(requestedSections()).toHaveLength(fetchedWhilePlaying)
  })

  it('applies the chosen speed to the audio, and keeps it for the next topic', async () => {
    const { container, unmount } = renderPlayer(SECTIONS, 'Closures')

    await userEvent.click(screen.getByLabelText('Narration speed, currently 1 times'))
    await waitFor(() => expect(audioIn(container)?.playbackRate).toBe(1.25))

    unmount()
    renderPlayer(SECTIONS, 'Prototypes')

    expect(screen.getByLabelText('Narration speed, currently 1.25 times')).toBeDefined()
  })

  it('says why nothing is playing when the engine refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'The speech engine is not answering' }), {
            status: 502,
          }),
      ),
    )

    renderPlayer(SECTIONS, 'Closures')
    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() =>
      expect(screen.getByText('The speech engine is not answering')).toBeDefined(),
    )
    // Not left claiming to play something that never started.
    expect(screen.getByLabelText('Play narration')).toBeDefined()
  })

  it('retries a failed section rather than replaying the failure', async () => {
    const failing = vi.fn(async () => new Response('{}', { status: 502 }))
    vi.stubGlobal('fetch', failing)

    renderPlayer(SECTIONS, 'Closures')
    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() =>
      expect(screen.getByText('The voice is not available right now.')).toBeDefined(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('RIFF....WAVE', { headers: { 'Content-Type': 'audio/wav' } })),
    )
    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalled())
  })

  it('records the first section when the topic is opened, without downloading it', async () => {
    renderPlayer(SECTIONS, 'Closures')

    await waitFor(() => expect(warmed()).toEqual([{ narration: 'first' }]))
    // A reader who never presses play costs a recording on the server and no
    // audio over the wire.
    expect(requestedSections()).toEqual([])
  })

  it('warms once, rather than again every time the page re-renders', async () => {
    const { rerender } = renderPlayer(SECTIONS, 'Closures')

    // A fresh array of the same sections is what a server re-render hands back.
    rerender(
      <NarrationProvider sections={[...SECTIONS]} title="Closures">
        <TopicReader />
      </NarrationProvider>,
    )

    await waitFor(() => expect(warmed()).toHaveLength(1))
  })

  it('renders nothing rather than an empty player when there are no sections', () => {
    const { container } = renderPlayer([], 'Closures')
    expect(container.querySelector('[data-topic-reader]')).toBeNull()
  })
})
