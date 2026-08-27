'use client'

import { useEffect, useRef, useState } from 'react'
import { SpeakerIcon, SpeakerOffIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import { fetchNarrationAudio, NarrationUnavailableError } from './narration-audio'
import { useNarrationSpeed } from './playback-speed'

/**
 * "Read this to me" on one piece of text: a question, or the answer once it has
 * been given.
 *
 * It asks for the recording by key and never sends the words, which is what
 * keeps a question's answer off the page until it has been given. The recording
 * is made the first time somebody asks for it, so a question added a minute ago
 * can be listened to. See
 * docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
 *
 * The page can hold several of these. Two of them playing at once would be two
 * voices over each other, so starting one stops whichever was speaking.
 */

/** The button currently speaking, so the next one to start can stop it. */
let speaking: { stop: () => void } | null = null

/**
 * How long a wait can go unexplained. Synthesis runs at about 22 milliseconds
 * per character, so a prompt nobody has asked for before takes several seconds,
 * and a pulsing icon for that long reads as a broken button. A recording that
 * already exists arrives well inside this, so the ordinary press says nothing.
 */
const SAY_WHY_AFTER = 1000

const MAKING_IT = 'Recording this for the first time.'

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
  const [slow, setSlow] = useState(false)
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

  useEffect(() => {
    if (state !== 'loading') return

    const timer = setTimeout(() => setSlow(true), SAY_WHY_AFTER)
    return () => clearTimeout(timer)
  }, [state])

  const status = error ?? (slow && state === 'loading' ? MAKING_IT : null)

  async function toggle() {
    if (!audioKey) return
    if (state === 'playing') {
      stop.current()
      speaking = null
      return
    }
    if (state === 'loading') return

    speaking?.stop()
    speaking = { stop: stop.current }

    setError(null)
    setSlow(false)
    setState('loading')

    try {
      const element = audio.current
      if (!element) return

      if (!url.current) {
        url.current = URL.createObjectURL(await fetchNarrationAudio(audioKey))
        element.src = url.current
      }

      element.playbackRate = speed
      await element.play()
      setState('playing')
    } catch (failure) {
      speaking = null
      setState('idle')
      setError(
        failure instanceof NarrationUnavailableError
          ? failure.message
          : 'That recording will not play here.',
      )
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

      {status ? (
        <span role="status" className="text-xs text-muted">
          {status}
        </span>
      ) : null}

      {/* One element per button, because the gesture that allows playback
          belongs to the element it was made on. */}
      <audio ref={audio} onEnded={() => setState('idle')} className="hidden" />
    </span>
  )
}
