import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeakButton } from './speak-button'

let play: ReturnType<typeof vi.fn<() => Promise<void>>>
let pause: ReturnType<typeof vi.fn<() => void>>

/** jsdom has neither media playback nor object URLs, so both are stubbed. */
beforeEach(() => {
  play = vi.fn<() => Promise<void>>(async () => undefined)
  pause = vi.fn<() => void>()

  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(play)
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(pause)

  URL.createObjectURL = vi.fn(() => 'blob:spoken')
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
})

describe('SpeakButton', () => {
  it('fetches the built recording by key and plays it', async () => {
    render(<SpeakButton audioKey="abc123" label="Listen to the question" />)

    await userEvent.click(screen.getByRole('button', { name: 'Listen to the question' }))

    await waitFor(() => expect(play).toHaveBeenCalled())
    // No cache option: a forced cache would replay a 404 taken before the
    // recording was built, and the response carries its own caching anyway.
    expect(fetch).toHaveBeenCalledWith('/api/speech/abc123')
  })

  it('pauses when it is pressed again, rather than starting a second time', async () => {
    render(<SpeakButton audioKey="abc123" label="Listen to the question" />)
    const button = screen.getByRole('button', { name: 'Listen to the question' })

    await userEvent.click(button)
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByRole('button', { name: 'Stop listening' }))
    expect(pause).toHaveBeenCalled()
  })

  it('says what to run when the section has never been recorded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    )
    render(<SpeakButton audioKey="missing" label="Listen to the question" />)

    await userEvent.click(screen.getByRole('button', { name: 'Listen to the question' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain('npm run narration:build'),
    )
    expect(play).not.toHaveBeenCalled()
  })

  it('says the session expired rather than blaming the recording', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 401 })),
    )
    render(<SpeakButton audioKey="abc123" label="Listen to the question" />)

    await userEvent.click(screen.getByRole('button', { name: 'Listen to the question' }))

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Sign in'))
  })

  it('stops whatever else is speaking, so two buttons are never two voices', async () => {
    render(
      <>
        <SpeakButton audioKey="one" label="Listen to the question" />
        <SpeakButton audioKey="two" label="Listen to the answer" />
      </>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Listen to the question' }))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByRole('button', { name: 'Listen to the answer' }))
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2))

    expect(pause).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Listen to the question' })).toBeDefined()
  })

  it('renders nothing without a key, since there is no recording to ask for', () => {
    render(<SpeakButton label="Listen to the question" />)

    expect(screen.queryByRole('button')).toBeNull()
  })
})
