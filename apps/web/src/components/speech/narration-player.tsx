'use client'

import { createContext, useCallback, useContext, useMemo, useEffect, useRef, useState } from 'react'
import {
  fetchNarrationAudio,
  NarrationUnavailableError,
  type SpokenSection,
} from './narration-audio'
import { useNarrationSpeed, type NarrationSpeed } from './playback-speed'
import { warmNarration } from './warm'

export type NarrationPlayer = {
  sections: SpokenSection[]
  /**
   * The reader card on the page. The bar that follows the reader down the lesson
   * watches it, and appears once it has scrolled out of sight.
   */
  card: React.RefObject<HTMLDivElement | null>
  /** The topic being read, used wherever the player has to name what it is playing. */
  title: string
  index: number
  section: SpokenSection | undefined
  playing: boolean
  preparing: boolean
  error: string | null
  /**
   * On from the moment the first section actually starts until the last one
   * ends. It is what the lesson follows: a reader who never pressed play, or who
   * has heard the topic out, gets the page back exactly as it was.
   */
  following: boolean
  speed: NarrationSpeed
  setSpeed: (speed: NarrationSpeed) => void
  toggle: () => Promise<void>
  playFrom: (index: number) => Promise<void>
}

const NarrationContext = createContext<NarrationPlayer | null>(null)

/** The player, for anything that controls it or follows it. */
export function useNarration(): NarrationPlayer {
  const player = useContext(NarrationContext)
  if (!player) throw new Error('Narration controls have to be inside a NarrationProvider')
  return player
}

/**
 * Owns playing a topic's narration: which section, whether it is running, and
 * the one audio element it all comes out of.
 *
 * It is a provider rather than a component with buttons because three things
 * need the same playback. The card on the page, the bar that follows you down
 * it, and the lesson highlighting the part being spoken. Two audio elements
 * would mean two voices.
 *
 * There is exactly one `<audio>` element and its `src` is swapped, rather than
 * an element per section. A browser only allows playback to start from a user
 * gesture, and the permission belongs to the element: a fresh element created
 * when a section ends would be refused, and the narration would stop after the
 * first part.
 */
export function NarrationProvider({
  sections,
  title,
  children,
}: {
  sections: SpokenSection[]
  title: string
  children: React.ReactNode
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const card = useRef<HTMLDivElement>(null)
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
  const [following, setFollowing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [speed, setSpeed] = useNarrationSpeed()

  const isLast = index >= sections.length - 1

  const sourceFor = useCallback(
    (target: number): Promise<string> => {
      const existing = requests.current.get(target)
      if (existing) return existing

      const section = sections[target]
      if (!section) return Promise.reject(new Error(`There is no narration section ${target}`))

      const request = fetchNarrationAudio(section.key)
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
        // Only now, because a lesson that dimmed itself around a section that
        // then failed to play would be following nothing.
        setFollowing(true)

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

  const first = sections[0]?.key

  /**
   * The first section is made when the topic is opened rather than when play is
   * pressed, so the wait a listener meets is whatever is left of it.
   *
   * It asks for the recording to exist rather than for it to be sent. Most of
   * the cost is synthesis, a section is a few megabytes, and most topic pages
   * are read rather than listened to: a reader who never presses play should
   * cost one recording on the server and no download.
   */
  useEffect(() => {
    if (first) warmNarration(first)
  }, [first])

  useEffect(() => {
    const inFlight = requests.current
    return () => {
      inFlight.forEach((request) => {
        void request.then(URL.revokeObjectURL, () => undefined)
      })
      inFlight.clear()
    }
  }, [])

  const player = useMemo<NarrationPlayer>(
    () => ({
      sections,
      card,
      title,
      index,
      section: sections[index],
      playing,
      preparing,
      error,
      following,
      speed,
      setSpeed,
      toggle,
      playFrom,
    }),
    [
      sections,
      title,
      index,
      playing,
      preparing,
      error,
      following,
      speed,
      setSpeed,
      toggle,
      playFrom,
    ],
  )

  return (
    <NarrationContext.Provider value={player}>
      {children}

      <audio
        ref={audio}
        hidden
        preload="none"
        onEnded={() => {
          if (isLast) {
            setPlaying(false)
            // The topic has been heard out, so the lesson stops following and
            // reads as an ordinary page again.
            setFollowing(false)
          } else {
            void playFrom(index + 1)
          }
        }}
      />
    </NarrationContext.Provider>
  )
}
