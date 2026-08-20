import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SpokenSection } from './narration-audio'
import { NarratedLesson } from './narrated-lesson'
import { NARRATED } from './narrated-section'
import { NarrationProvider } from './narration-player'
import { TopicReader } from './topic-reader'

const SECTIONS: SpokenSection[] = [
  { title: 'The opening', heading: 'Why this matters', script: 'Why it matters.', key: 'one' },
  { title: 'The middle', heading: 'Truthiness', script: 'Eight falsy values.', key: 'two' },
]

let scrolledTo: string[]

beforeEach(() => {
  scrolledTo = []

  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(async () => undefined)
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
  // jsdom has no layout, so scrolling is recorded rather than performed.
  vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView').mockImplementation(function (
    this: HTMLElement,
  ) {
    scrolledTo.push(this.id)
  })

  URL.createObjectURL = vi.fn(() => 'blob:section')
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('RIFF....WAVE', { headers: { 'Content-Type': 'audio/wav' } })),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.localStorage.clear()
})

function renderLesson() {
  return render(
    <NarrationProvider sections={SECTIONS} title="Types and coercion">
      <TopicReader />
      <NarratedLesson>
        <h2 id="why-this-matters">Why this matters</h2>
        <p>The opening paragraph.</p>
        <h2 id="truthiness">Truthiness</h2>
        <p>Eight falsy values.</p>
      </NarratedLesson>
    </NarrationProvider>,
  )
}

const litUp = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(`[${NARRATED}]`)).map((element) =>
    element.textContent?.trim(),
  )

describe('NarratedLesson', () => {
  it('is an ordinary lesson until something is played', () => {
    const { container } = renderLesson()

    expect(container.querySelector('[data-narrated-lesson="true"]')).toBeNull()
    expect(litUp(container)).toEqual([])
  })

  it('lights up the section the voice is on, and scrolls to it', async () => {
    const { container } = renderLesson()

    await userEvent.click(screen.getByLabelText('Play narration'))

    await waitFor(() =>
      expect(litUp(container)).toEqual(['Why this matters', 'The opening paragraph.']),
    )
    expect(scrolledTo).toEqual(['why-this-matters'])
  })

  it('follows the narration on to the next section', async () => {
    const { container } = renderLesson()

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(litUp(container)).toHaveLength(2))

    const audio = container.querySelector('audio')
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(litUp(container)).toEqual(['Truthiness', 'Eight falsy values.']))
    expect(scrolledTo).toEqual(['why-this-matters', 'truthiness'])
  })

  it('hands the lesson back when the topic has been heard out', async () => {
    const { container } = renderLesson()

    await userEvent.click(screen.getByLabelText('Next section'))
    await waitFor(() => expect(litUp(container)).toEqual(['Truthiness', 'Eight falsy values.']))

    const audio = container.querySelector('audio')
    if (audio) fireEvent.ended(audio)

    await waitFor(() => expect(litUp(container)).toEqual([]))
    expect(container.querySelector('[data-narrated-lesson="true"]')).toBeNull()
  })

  it('keeps the section lit while the narration is paused', async () => {
    const { container } = renderLesson()

    await userEvent.click(screen.getByLabelText('Play narration'))
    await waitFor(() => expect(litUp(container)).toHaveLength(2))

    await userEvent.click(screen.getByLabelText('Pause narration'))

    // Pausing is a reader stopping to look at the part being talked about, not
    // leaving it.
    expect(litUp(container)).toEqual(['Why this matters', 'The opening paragraph.'])
  })
})
