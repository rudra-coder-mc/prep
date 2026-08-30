import type { ArchiveContent } from '@prep/content/archive/types'
import type { FileStore } from '../archive/files'
import type { ServerClient } from '../server/client'
import { AUDIO_ROOT, heldBytes, heldRecordings, recordingPath, trackAudioKeys } from './library'

/**
 * Bringing a track's audio onto the device: what it would cost, and then doing
 * it.
 *
 * The two are separate because the whole point is being told the price before
 * paying it. The library is hundreds of megabytes against a phone's storage,
 * which is what made task 22 worth doing, so a download starts only after a
 * number has been shown. See
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 */

export type HeldAudio = {
  /** Every recording the track needs, whether or not it exists anywhere. */
  total: number
  /** What is already on the device, out of those. */
  held: { count: number; bytes: number }
  /** The rest, which only the server can price. */
  wanted: string[]
}

/**
 * What the device holds of a track, read off the archive and the filesystem
 * with nothing switched on.
 *
 * Separate from the survey below because this half always has an answer. A
 * phone out of reach of the server can still say what it is carrying, and a
 * screen that could only say it while online would be the one place in the app
 * that stopped working when the machine did.
 */
export async function heldTrackAudio({
  files,
  content,
  technology,
}: {
  files: FileStore
  content: ArchiveContent
  technology: string
}): Promise<HeldAudio> {
  const keys = trackAudioKeys(content, technology)
  const held = await heldRecordings(files, keys)

  return {
    total: keys.length,
    held: { count: held.size, bytes: await heldBytes(files, held) },
    wanted: keys.filter((key) => !held.has(key)),
  }
}

export type AudioSurvey = HeldAudio & {
  /** What the server holds and this device does not, which is the download. */
  pending: { count: number; bytes: number }
  /** Keys nothing has been recorded for. `npm run narration:build` is the answer. */
  unrecorded: number
  /** The keys to ask for, in the order the track reads. */
  order: string[]
}

export async function surveyTrackAudio({
  files,
  client,
  content,
  technology,
}: {
  files: FileStore
  client: ServerClient
  content: ArchiveContent
  technology: string
}): Promise<AudioSurvey> {
  const local = await heldTrackAudio({ files, content, technology })

  const sizes = await client.audioSizes(local.wanted)
  const order = local.wanted.filter((key) => sizes.has(key))

  return {
    ...local,
    pending: {
      count: order.length,
      bytes: order.reduce((total, key) => total + (sizes.get(key) ?? 0), 0),
    },
    unrecorded: local.wanted.length - order.length,
    order,
  }
}

export type DownloadProgress = {
  /** Recordings written so far, out of the ones this run set out to fetch. */
  done: number
  total: number
  bytes: number
}

export type DownloadResult = { downloaded: number; bytes: number; unrecorded: number }

/**
 * Fetches the given keys, one file at a time, skipping anything already here.
 *
 * There is no resume logic and there does not need to be any. One recording is
 * one file and one request, and a file is written only once its bytes have all
 * arrived, so a download killed halfway leaves whole recordings behind and the
 * next run asks for the rest. That is what the endpoint was shaped for: see
 * apps/web/src/app/api/device/audio/[key]/route.ts.
 *
 * A failure stops the run and is thrown, because the usual failure is the
 * server going out of reach and the remaining thousand requests would each fail
 * the same way. What arrived stays on the device.
 */
export async function downloadRecordings({
  files,
  client,
  keys,
  onProgress,
  stopped,
}: {
  files: FileStore
  client: ServerClient
  keys: string[]
  onProgress?: (progress: DownloadProgress) => void
  /** Asked before every recording, so leaving the screen ends the run. */
  stopped?: () => boolean
}): Promise<DownloadResult> {
  if (keys.length === 0) return { downloaded: 0, bytes: 0, unrecorded: 0 }

  await files.makeDirectory(AUDIO_ROOT)

  const result: DownloadResult = { downloaded: 0, bytes: 0, unrecorded: 0 }

  for (const key of keys) {
    if (stopped?.()) break

    const path = recordingPath(key)
    // A survey taken a moment ago, and a run that was interrupted and started
    // again, both hand over keys that have since arrived.
    if (await files.exists(path)) continue

    const audio = await client.downloadAudio(key)
    if (!audio) {
      result.unrecorded += 1
      continue
    }

    await files.writeBytes(path, audio)
    result.downloaded += 1
    result.bytes += audio.byteLength

    onProgress?.({ done: result.downloaded, total: keys.length, bytes: result.bytes })
  }

  return result
}
