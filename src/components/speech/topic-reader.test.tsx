import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Narration } from '@/content/schema'
import { TopicReader } from './topic-reader'

const SECTIONS: Narration = [
  { title: 'Why this matters', script: 'The first thing to say out loud.' },
  { title: 'The idea', script: 'The second thing to say out loud.' },
  { title: 'The interview angle', script: 'The last thing to say out loud.' },
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

const spokenScripts = () =>
  vi.mocked(fetch).mock.calls.map(([, init]) => JSON.parse(String(init?.body)).text as string)

const audioIn = (container: HTMLElement) =>
  container.querySelector('audio') as HTMLAudioElement | null

describe('TopicReader', () => {
  it('shows where the listener is before anything is played', () => {
    render(<TopicReader sections={SECTIONS} title="Closures" />)

    expect(screen.getByText('Why this matters')).toBeDefined()
    expect(screen.getByText('1 of 3')).toBeDefined()
  })

  it('plays the first section on the first press', async () => {
    const { container } = render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalled())
    expect(spokenScripts()[0]).toBe('The first thing to say out loud.')
    expect(audioIn(container)?.src).toContain('blob:section-0')
  })

  it('fetches the next section while the current one plays', async () => {
    render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(spokenScripts()).toHaveLength(2))
    expect(spokenScripts()[1]).toBe('The second thing to say out loud.')
  })

  it('moves to the next section by itself when one ends', async () => {
    const { container } = render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(play).toHaveBeenCalled())

    const audio = audioIn(container)
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(screen.getByText('The idea')).toBeDefined())
    expect(screen.getByText('2 of 3')).toBeDefined()
  })

  it('stops at the end rather than looping', async () => {
    const { container } = render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Next section'))
    await userEvent.click(screen.getByLabelText('Next section'))
    await waitFor(() => expect(screen.getByText('3 of 3')).toBeDefined())

    const audio = audioIn(container)
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(screen.getByLabelText('Play narration')).toBeDefined())
    expect(screen.getByText('3 of 3')).toBeDefined()
  })

  it('will not step past either end', async () => {
    render(<TopicReader sections={SECTIONS} title="Closures" />)

    expect(screen.getByLabelText('Previous section')).toHaveProperty('disabled', true)

    await userEvent.click(screen.getByLabelText('Next section'))
    await userEvent.click(screen.getByLabelText('Next section'))

    await waitFor(() =>
      expect(screen.getByLabelText('Next section')).toHaveProperty('disabled', true),
    )
  })

  it('resumes where it paused instead of asking for the audio again', async () => {
    render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))
    const fetchedWhilePlaying = spokenScripts().length

    await userEvent.click(screen.getByLabelText('Pause narration'))
    expect(pause).toHaveBeenCalled()

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))
    expect(spokenScripts()).toHaveLength(fetchedWhilePlaying)
  })

  it('applies the chosen speed to the audio, and keeps it for the next topic', async () => {
    const { container, unmount } = render(<TopicReader sections={SECTIONS} title="Closures" />)

    await userEvent.click(screen.getByLabelText('Narration speed, currently 1 times'))
    await waitFor(() => expect(audioIn(container)?.playbackRate).toBe(1.25))

    unmount()
    render(<TopicReader sections={SECTIONS} title="Prototypes" />)

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

    render(<TopicReader sections={SECTIONS} title="Closures" />)
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

    render(<TopicReader sections={SECTIONS} title="Closures" />)
    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(failing).toHaveBeenCalledTimes(1))

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('RIFF....WAVE', { headers: { 'Content-Type': 'audio/wav' } })),
    )
    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() => expect(play).toHaveBeenCalled())
  })

  it('renders nothing rather than an empty player when there are no sections', () => {
    const { container } = render(<TopicReader sections={[]} title="Closures" />)
    expect(container.querySelector('[data-topic-reader]')).toBeNull()
  })
})
