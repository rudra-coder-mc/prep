import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FollowingReader } from './following-reader'
import type { SpokenSection } from './narration-audio'
import { NarrationProvider } from './narration-player'
import { TopicReader } from './topic-reader'

const SECTIONS: SpokenSection[] = [
  { title: 'The opening', heading: 'Why this matters', key: 'one' },
  { title: 'The middle', heading: 'Truthiness', key: 'two' },
]

let pause: ReturnType<typeof vi.fn<() => void>>
/** Reports what the observer would report when the card scrolls out of view. */
let scrollCardAway: () => void

/**
 * jsdom has no layout and so no IntersectionObserver. This is the smallest one
 * that still lets the bar's own rule be observed: the card is on screen until a
 * test says it is not.
 */
function stubIntersectionObserver() {
  class Stub {
    constructor(private readonly report: IntersectionObserverCallback) {}
    observe(element: Element) {
      scrollCardAway = () =>
        this.report([{ isIntersecting: false, target: element } as IntersectionObserverEntry], this)
    }
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return []
    }
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds = []
  }

  vi.stubGlobal('IntersectionObserver', Stub)
}

beforeEach(() => {
  pause = vi.fn<() => void>()
  scrollCardAway = () => {
    throw new Error('Nothing is watching the reader card')
  }

  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(async () => undefined)
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(pause)

  URL.createObjectURL = vi.fn(() => 'blob:section')
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () => new Response('OggS....OpusHead', { headers: { 'Content-Type': 'audio/ogg' } }),
    ),
  )
  stubIntersectionObserver()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

function renderPage() {
  return render(
    <NarrationProvider sections={SECTIONS} title="Types and coercion">
      <TopicReader />
      <FollowingReader />
    </NarrationProvider>,
  )
}

const bar = () => screen.queryByRole('group', { name: 'Narration controls' })

describe('FollowingReader', () => {
  it('stays out of the way while the reader card is on screen', async () => {
    renderPage()

    await userEvent.click(screen.getByLabelText('Play narration'))

    expect(bar()).toBeNull()
  })

  it('follows the listener down the page once the card has scrolled away', async () => {
    renderPage()

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(screen.getByLabelText('Pause narration')).toBeDefined())
    scrollCardAway()

    await waitFor(() => expect(bar()).not.toBeNull())
    const following = bar()
    expect(following && within(following).getByText('The opening')).toBeDefined()
    expect(following && within(following).getByText('1 of 2')).toBeDefined()
  })

  it('is not there for a reader who has not pressed play', async () => {
    renderPage()
    scrollCardAway()

    // The page is only different for somebody listening to it.
    await waitFor(() => expect(bar()).toBeNull())
  })

  it('drives the same playback the card does', async () => {
    renderPage()

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(screen.getByLabelText('Pause narration')).toBeDefined())
    scrollCardAway()
    await waitFor(() => expect(bar()).not.toBeNull())

    const following = bar()
    if (following) await userEvent.click(within(following).getByLabelText('Pause narration'))

    expect(pause).toHaveBeenCalled()
    // One player, so the card and the bar say the same thing about it.
    expect(screen.getAllByLabelText('Play narration')).toHaveLength(2)
  })

  it('goes away again when the topic has been heard out', async () => {
    const { container } = renderPage()

    await userEvent.click(screen.getByLabelText('Next section'))
    await waitFor(() => expect(screen.getByText('2 of 2')).toBeDefined())
    scrollCardAway()
    await waitFor(() => expect(bar()).not.toBeNull())

    const audio = container.querySelector('audio')
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(bar()).toBeNull())
  })
})
