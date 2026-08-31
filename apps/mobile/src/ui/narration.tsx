import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { recordingUri } from '../audio/expo'
import type { PlayableSection } from '../lesson/narration'
import { colors, radius, space } from './theme'

/**
 * The player for a lesson's narration: native, around a page that is not.
 *
 * It plays a topic through, section by section, and says which section it is on
 * so the page can light up the part of the lesson being spoken. That is the
 * whole of what crosses. See
 * docs/decisions/0018-the-lesson-follows-the-voice.md.
 *
 * The screen shows this only when the track's recordings are on the device, so
 * everything here reads a local file and nothing reaches the network.
 */
export function Narration({
  sections,
  onSection,
}: {
  sections: PlayableSection[]
  /** The heading the voice is on, and null once it has stopped following. */
  onSection: (slug: string | null) => void
}) {
  const player = useAudioPlayer()
  const status = useAudioPlayerStatus(player)
  const [index, setIndex] = useState(0)
  /**
   * On from the moment a section starts until the last one ends, exactly as on
   * the web: a reader who never pressed play gets the page it already was.
   */
  const [following, setFollowing] = useState(false)

  // The end of a section is reported until the next one starts, so it is acted
  // on once and then ignored until something is playing again.
  const finished = useRef(false)

  const playFrom = useCallback(
    (target: number) => {
      const section = sections[target]
      if (!section) return

      finished.current = false
      setIndex(target)
      setFollowing(true)
      player.replace(recordingUri(section.audioKey))
      player.play()
      onSection(section.slug)
    },
    [sections, player, onSection],
  )

  // The next section starts when this one ends, so a topic is heard through the
  // way it is on the laptop rather than a section at a time.
  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', (update) => {
      if (!update.didJustFinish || finished.current) return
      finished.current = true

      if (index + 1 < sections.length) {
        playFrom(index + 1)
        return
      }

      // The topic has been heard out, so the lesson stops following and reads
      // as an ordinary page again.
      setFollowing(false)
      onSection(null)
    })

    return () => subscription.remove()
  }, [player, index, sections, playFrom, onSection])

  const section = sections[index]
  if (!section) return null

  function toggle() {
    if (status.playing) {
      player.pause()
      return
    }
    // A section that is loaded and was paused carries on from where it stopped.
    // Anything else, the end of the topic included, starts this section again.
    if (following && status.isLoaded) player.play()
    else playFrom(index)
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>
          {section.title}
        </Text>
        <Text style={styles.position}>
          {index + 1} of {sections.length}
        </Text>
      </View>

      <View style={styles.controls}>
        <Control
          label={status.playing ? 'Pause narration' : 'Play narration'}
          text={status.playing ? '■' : '▶'}
          tone="accent"
          onPress={toggle}
        />
        <Control
          label="Previous section"
          text="‹"
          disabled={index === 0}
          onPress={() => playFrom(index - 1)}
        />
        <Control
          label="Next section"
          text="›"
          disabled={index >= sections.length - 1}
          onPress={() => playFrom(index + 1)}
        />
      </View>
    </View>
  )
}

function Control({
  label,
  text,
  onPress,
  disabled = false,
  tone = 'quiet',
}: {
  label: string
  text: string
  onPress: () => void
  disabled?: boolean
  tone?: 'accent' | 'quiet'
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.control,
        tone === 'accent' && styles.accent,
        disabled && styles.off,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.controlText, tone === 'accent' && styles.accentText]}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    gap: space.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.fg, fontSize: 15, fontWeight: '500', flex: 1 },
  position: { color: colors.faint, fontSize: 12 },
  controls: { flexDirection: 'row', gap: space.sm },
  control: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  accent: { borderColor: colors.accent },
  off: { opacity: 0.35 },
  pressed: { backgroundColor: colors.raised },
  controlText: { color: colors.muted, fontSize: 16 },
  accentText: { color: colors.accent },
})
