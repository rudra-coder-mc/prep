import type { ArchiveContent } from '@prep/content/archive/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import {
  downloadRecordings,
  heldTrackAudio,
  surveyTrackAudio,
  type AudioSurvey,
  type HeldAudio,
} from '../audio/download'
import type { FileStore } from '../archive/files'
import type { ServerClient } from '../server/client'
import { Button, Card, Heading, Muted, Problem } from './components'
import { formatBytes } from './format'
import { colors, radius, space } from './theme'

/**
 * A track's audio: what the device holds, what a download would cost, and the
 * download.
 *
 * The price comes first because the library is hundreds of megabytes and the
 * phone's storage is the constraint that made task 22 worth doing. What is held
 * is read locally and always shown; what is missing needs the server and is
 * shown when it answers. See
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 */

type Running = { done: number; total: number; bytes: number }

/** Everything one look at the track answers, taken together so it lands together. */
type Seen = { local: HeldAudio; survey: AudioSurvey | null; unreachable: string | null }

export function TrackAudio({
  content,
  files,
  client,
  technology,
}: {
  content: ArchiveContent
  files: FileStore
  client: ServerClient | null
  technology: string
}) {
  const [seen, setSeen] = useState<Seen | null>(null)
  const [running, setRunning] = useState<Running | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  // Read rather than state, so stopping takes effect inside a run that is
  // already looping rather than at the next render.
  const stopped = useRef(false)

  const look = useCallback(async (): Promise<Seen> => {
    const local = await heldTrackAudio({ files, content, technology })
    if (!client) return { local, survey: null, unreachable: null }

    try {
      return {
        local,
        survey: await surveyTrackAudio({ files, client, content, technology }),
        unreachable: null,
      }
    } catch (error) {
      // Being out of reach of the server is the ordinary case rather than a
      // failure, and what the device holds is on the screen either way.
      return { local, survey: null, unreachable: describe(error) }
    }
  }, [files, client, content, technology])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const looked = await look()
      if (!cancelled) setSeen(looked)
    })()

    return () => {
      cancelled = true
    }
  }, [look])

  async function download() {
    const survey = seen?.survey
    if (!client || !survey) return

    stopped.current = false
    setProblem(null)
    setRunning({ done: 0, total: survey.pending.count, bytes: 0 })
    try {
      await downloadRecordings({
        files,
        client,
        keys: survey.order,
        onProgress: (progress) => setRunning({ ...progress, total: survey.pending.count }),
        stopped: () => stopped.current,
      })
    } catch (error) {
      setProblem(describe(error))
    } finally {
      setRunning(null)
      // Whatever happened, the truth is on the filesystem, so the card is
      // rebuilt from it rather than from what the run thought it did.
      setSeen(await look())
    }
  }

  const local = seen?.local ?? null
  const survey = seen?.survey ?? null

  if (!local) return null

  return (
    <Card>
      <Heading>Audio</Heading>
      <Muted>
        {local.held.count} of {local.total} recordings on this phone
        {local.held.count > 0 ? `, ${formatBytes(local.held.bytes)}` : ''}
      </Muted>

      {running ? (
        <>
          <Muted>
            Downloading {running.done} of {running.total} · {formatBytes(running.bytes)}
          </Muted>
          <Bar done={running.done} total={running.total} />
          <View style={styles.action}>
            <Button
              label="Stop"
              tone="quiet"
              onPress={() => {
                stopped.current = true
              }}
            />
          </View>
        </>
      ) : survey && survey.pending.count > 0 ? (
        <>
          <Muted>
            {survey.pending.count} more to download, {formatBytes(survey.pending.bytes)}.
          </Muted>
          <View style={styles.action}>
            <Button label="Download this track" onPress={() => void download()} />
          </View>
        </>
      ) : survey && local.held.count > 0 ? (
        <Muted>
          Everything recorded for this track is here. It plays with nothing switched on.
        </Muted>
      ) : null}

      {survey && survey.unrecorded > 0 ? (
        <Muted>
          {survey.unrecorded} have not been recorded yet. Run the narration build on the machine.
        </Muted>
      ) : null}

      {(problem ?? seen?.unreachable) ? <Problem>{problem ?? seen?.unreachable}</Problem> : null}
    </Card>
  )
}

function Bar({ done, total }: { done: number; total: number }) {
  const share = total === 0 ? 0 : Math.min(1, done / total)

  return (
    <View style={styles.bar}>
      <View style={[styles.barDone, { flex: share }]} />
      <View style={{ flex: 1 - share }} />
    </View>
  )
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const styles = StyleSheet.create({
  action: { marginTop: space.sm },
  bar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.raised,
    overflow: 'hidden',
    marginTop: space.xs,
  },
  barDone: { backgroundColor: colors.accent, borderRadius: radius.control },
})
