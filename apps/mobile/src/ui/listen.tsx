import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { recordingUri } from '../audio/expo'
import { recordingPath } from '../audio/library'
import type { FileStore } from '../archive/files'
import { colors, radius, space } from './theme'

/**
 * Playing one recording off the device.
 *
 * It shows nothing at all when the recording is not on this phone, which is the
 * ordinary state of a track nobody has downloaded: an audio control that did
 * nothing when pressed would be worse than no control. Recordings are downloaded
 * a track at a time from the track screen. See
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 *
 * Nothing here reaches the network. The file is on the device and the player
 * reads it from there, which is what makes a review session on a train work.
 */
export function Listen({
  files,
  audioKey,
  label = 'Listen',
}: {
  files: FileStore | null
  audioKey: string
  label?: string
}) {
  const [held, setHeld] = useState(false)
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const there = files ? await files.exists(recordingPath(audioKey)) : false
      if (!cancelled) setHeld(there)
    })()

    return () => {
      cancelled = true
    }
  }, [files, audioKey])

  if (!held) return null

  async function toggle() {
    if (status.playing) {
      player.pause()
      return
    }

    // A player that has already read this file to the end sits at the end of
    // it, so pressing again has to wind back rather than play nothing.
    if (status.isLoaded) await player.seekTo(0)
    else player.replace(recordingUri(audioKey))

    player.play()
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={status.playing ? 'Stop' : label}
      onPress={() => void toggle()}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.text}>{status.playing ? '■  Stop' : `▶  ${label}`}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: 40,
  },
  pressed: { backgroundColor: colors.raised },
  text: { color: colors.accent, fontSize: 14, fontWeight: '500' },
})
