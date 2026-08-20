'use client'

import { useEffect, useRef, useState } from 'react'
import { SpeakerIcon, SpeakerOffIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { useNarrationSpeed } from './playback-speed'

/**
 * "Read this to me" on one piece of text: a question, or the answer once it has
 * been given.
 *
 * It only ever plays a recording that already exists. Every question in
 * `content/` is built into audio by `npm run narration:build`, and the speech
 * engine is not running the rest of the time, so there is no synthesis to fall
 * back to. A key with nothing behind it means the text has changed since the
 * last build, and saying that is more useful than a spinner that never resolves.
 * See docs/decisions/0021-questions-are-spoken-from-built-audio.md.
 *
 * The page can hold several of these. Two of them playing at once would be two
 * voices over each other, so starting one stops whichever was speaking.
 */

/** The button currently speaking, so the next one to start can stop it. */
let speaking: { stop: () => void } | null = null

type State = 'idle' | 'loading' | 'playing'

export function SpeakButton({
  audioKey,
  label,
  className,
}: {
  /** Absent when the caller has nothing recorded to point at, which renders nothing. */
  audioKey?: string
  /** What this reads, said in full, since the button itself is an icon. */
  label: string
  className?: string
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const url = useRef<string | null>(null)
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)
  const [speed] = useNarrationSpeed()

  // Held in a ref so the registry above can stop this button without holding on
  // to a function that changes every render.
  const stop = useRef(() => {
    audio.current?.pause()
    setState('idle')
  })

  // The blob URL outlives a render, so it is released when the button goes away
  // rather than left for the tab to accumulate.
  useEffect(() => {
    const release = stop.current
    return () => {
      if (url.current) URL.revokeObjectURL(url.current)
      if (speaking?.stop === release) speaking = null
    }
  }, [])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed
  }, [speed, state])

  async function toggle() {
    if (state === 'playing') {
      stop.current()
      speaking = null
      return
    }
    if (state === 'loading') return

    speaking?.stop()
    speaking = { stop: stop.current }

    setError(null)
    setState('loading')

    try {
      const element = audio.current
      if (!element) return

      if (!url.current) {
        const response = await fetch(`/api/speech/${audioKey}`, { cache: 'force-cache' })
        if (!response.ok) {
          setState('idle')
          speaking = null
          setError(reasonFor(response.status))
          return
        }
        url.current = URL.createObjectURL(await response.blob())
        element.src = url.current
      }

      element.playbackRate = speed
      await element.play()
      setState('playing')
    } catch {
      speaking = null
      setState('idle')
      setError('That recording will not play here.')
    }
  }

  if (!audioKey) return null

  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={state === 'playing' ? 'Stop listening' : label}
        className={cx(
          'rounded-full border border-border p-1.5 text-muted transition-colors',
          'hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:outline-none',
          state === 'playing' && 'border-accent text-accent',
          state === 'loading' && 'animate-pulse',
        )}
      >
        {state === 'playing' ? <SpeakerOffIcon /> : <SpeakerIcon />}
      </button>

      {error ? (
        <span role="status" className="text-xs text-muted">
          {error}
        </span>
      ) : null}

      {/* One element per button, because the gesture that allows playback
          belongs to the element it was made on. */}
      <audio ref={audio} onEnded={() => setState('idle')} className="hidden" />
    </span>
  )
}

function reasonFor(status: number): string {
  if (status === 401) return 'Sign in again to listen.'
  return 'Not recorded yet. Run npm run narration:build.'
}
