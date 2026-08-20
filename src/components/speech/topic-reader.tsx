'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, SectionLabel } from '@/components/ui/card'
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from '@/components/ui/icons'
import { cx } from '@/lib/cx'
import {
  fetchNarrationAudio,
  NarrationUnavailableError,
  type SpokenSection,
} from './narration-audio'
import { nextSpeed, useNarrationSpeed } from './playback-speed'

const ICON_BUTTON =
  'grid size-9 place-items-center rounded-lg border border-border text-muted transition hover:border-edge hover:bg-raised hover:text-fg active:scale-95 disabled:pointer-events-none disabled:opacity-35'

/**
 * Plays a topic's narration, one section at a time, and moves to the next one
 * by itself so a topic can be listened to end to end without touching anything.
 *
 * There is exactly one `<audio>` element and its `src` is swapped, rather than
 * an element per section. A browser only allows playback to start from a user
 * gesture, and the permission belongs to the element: a fresh element created
 * when a section ends would be refused, and the narration would stop after the
 * first part.
 */
export function TopicReader({ sections, title }: { sections: SpokenSection[]; title: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  /**
   * Section index to a request for its audio. Holding the request rather than
   * the finished URL is what makes asking twice cheap: a section already being
   * fetched is joined rather than fetched again.
   */
  const requests = useRef(new Map<number, Promise<string>>())
  /** Bumped on every play, so a slow load for a section nobody wants is ignored. */
  const generation = useRef(0)

  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speed, setSpeed] = useNarrationSpeed()

  const current = sections[index]
  const isFirst = index === 0
  const isLast = index >= sections.length - 1

  const sourceFor = useCallback(
    (target: number): Promise<string> => {
      const existing = requests.current.get(target)
      if (existing) return existing

      const section = sections[target]
      if (!section) return Promise.reject(new Error(`There is no narration section ${target}`))

      const request = fetchNarrationAudio(section.script, { key: section.key })
        .then((blob) => URL.createObjectURL(blob))
        .catch((failure: unknown) => {
          // Dropped so pressing play again is a real retry rather than a replay
          // of the same failure.
          requests.current.delete(target)
          throw failure
        })

      requests.current.set(target, request)
      return request
    },
    [sections],
  )

  const playFrom = useCallback(
    async (target: number) => {
      const element = audio.current
      if (!element || !sections[target]) return

      const request = ++generation.current
      setIndex(target)
      setError(null)
      setPreparing(true)
      setPlaying(true)

      try {
        const source = await sourceFor(target)
        if (generation.current !== request) return

        element.src = source
        element.playbackRate = speed
        await element.play()
        if (generation.current !== request) return

        setPreparing(false)

        // The next section is fetched while this one plays, so the gap between
        // them is silence the listener does not notice. A failure here is not
        // reported: if they get that far, playing it will report it properly.
        if (target + 1 < sections.length) void sourceFor(target + 1).catch(() => undefined)
      } catch (failure) {
        if (generation.current !== request) return
        setPreparing(false)
        setPlaying(false)
        setError(
          failure instanceof NarrationUnavailableError
            ? failure.message
            : 'This section could not be played.',
        )
      }
    },
    [sections, sourceFor, speed],
  )

  const toggle = useCallback(async () => {
    const element = audio.current
    if (!element) return

    if (playing) {
      element.pause()
      setPlaying(false)
      return
    }

    // Resuming keeps the position; only a section that was never loaded starts
    // from the endpoint.
    if (!element.src) {
      await playFrom(index)
      return
    }

    setPlaying(true)
    try {
      await element.play()
    } catch {
      setPlaying(false)
      setError('This section could not be played.')
    }
  }, [index, playing, playFrom])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed
  }, [speed])

  useEffect(() => {
    const inFlight = requests.current
    return () => {
      inFlight.forEach((request) => {
        void request.then(URL.revokeObjectURL, () => undefined)
      })
      inFlight.clear()
    }
  }, [])

  if (!current) return null

  return (
    <Card
      data-topic-reader
      role="group"
      aria-label={`Listen to ${title}`}
      className="border-accent/20 bg-gradient-to-br from-accent-dim/40"
    >
      <div className="flex items-center gap-3">
        <SectionLabel>Listen</SectionLabel>
        <span className="ml-auto text-xs text-faint tabular-nums">
          {index + 1} of {sections.length}
        </span>
      </div>

      <p data-reader-section className="mt-2 text-lg font-medium text-pretty">
        {current.title}
      </p>

      <p aria-live="polite" className="mt-1 min-h-5 text-sm text-muted">
        {error ??
          (preparing
            ? 'Reading this section for the first time. Every play after this one is instant.'
            : playing
              ? `Playing ${title} aloud.`
              : 'Paused.')}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-label={playing ? 'Pause narration' : 'Play narration'}
          className={cx(ICON_BUTTON, 'border-accent/40 text-accent hover:border-accent')}
        >
          {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
        </button>

        <button
          type="button"
          onClick={() => void playFrom(index - 1)}
          disabled={isFirst}
          aria-label="Previous section"
          className={ICON_BUTTON}
        >
          <ArrowLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => void playFrom(index + 1)}
          disabled={isLast}
          aria-label="Next section"
          className={ICON_BUTTON}
        >
          <ArrowRightIcon className="size-4" />
        </button>

        {/* Every visual on a lesson page carries a speed button of its own, so
            naming this one for what it controls is what keeps them apart - for
            a screen reader as much as for a test. */}
        <button
          type="button"
          onClick={() => setSpeed(nextSpeed(speed))}
          aria-label={`Narration speed, currently ${speed} times`}
          className={cx(ICON_BUTTON, 'w-auto px-2.5 font-mono text-xs tabular-nums')}
        >
          {speed}&times;
        </button>
      </div>

      <audio
        ref={audio}
        hidden
        preload="none"
        onEnded={() => {
          if (isLast) setPlaying(false)
          else void playFrom(index + 1)
        }}
      />
    </Card>
  )
}
