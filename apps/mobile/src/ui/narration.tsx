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
  const [minimized, setMinimized] = useState(false)
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

  if (minimized) {
    return (
      <View style={styles.floatingContainer} pointerEvents="box-none">
        <View style={[styles.minimizedPill, status.playing && styles.minimizedPillActive]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand narration player"
            onPress={() => setMinimized(false)}
            style={({ pressed }) => [styles.pillTouch, pressed && styles.pressed]}
          >
            <Text style={styles.pillIcon}>🎧</Text>
            <Text style={styles.pillText}>
              {index + 1}/{sections.length}
            </Text>
            <Text style={styles.pillExpand}>▼</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={status.playing ? 'Pause narration' : 'Play narration'}
            onPress={toggle}
            style={({ pressed }) => [
              styles.miniPlayBtn,
              status.playing && styles.miniPlayBtnActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={status.playing ? styles.miniPauseText : styles.miniPlayText}>
              {status.playing ? '❚❚' : '▶'}
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? 'Pause narration' : 'Play narration'}
        onPress={toggle}
        style={({ pressed }) => [
          styles.playBtn,
          status.playing && styles.playBtnActive,
          pressed && styles.pressed,
        ]}
      >
        <Text style={status.playing ? styles.pauseText : styles.playText}>
          {status.playing ? '❚❚' : '▶'}
        </Text>
      </Pressable>

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Minimize narration to read"
          onPress={() => setMinimized(true)}
          style={({ pressed }) => [styles.minBtn, pressed && styles.pressed]}
        >
          <Text style={styles.minBtnText}>▲</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Control({
  label,
  text,
  onPress,
  disabled = false,
}: {
  label: string
  text: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.control, disabled && styles.off, pressed && styles.pressed]}
    >
      <Text style={styles.controlText}>{text}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 46,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: colors.accent,
  },
  playText: {
    color: colors.accentFg,
    fontSize: 13,
    marginLeft: 2,
  },
  pauseText: {
    color: colors.accentFg,
    fontSize: 10,
    fontWeight: '700',
  },
  head: {
    flex: 1,
    gap: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.fg,
    fontSize: 14,
    fontWeight: '500',
  },
  position: {
    color: colors.faint,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  control: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  controlText: {
    color: colors.muted,
    fontSize: 15,
  },
  minBtn: {
    width: 26,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  minBtnText: {
    color: colors.faint,
    fontSize: 12,
  },
  floatingContainer: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    zIndex: 20,
    elevation: 6,
  },
  minimizedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingLeft: space.sm,
    paddingRight: 4,
    paddingVertical: 3,
    gap: space.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  minimizedPillActive: {
    borderColor: colors.accent,
  },
  pillTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillIcon: {
    fontSize: 13,
  },
  pillText: {
    color: colors.fg,
    fontSize: 12,
    fontWeight: '500',
  },
  pillExpand: {
    color: colors.accent,
    fontSize: 10,
    marginLeft: 2,
  },
  miniPlayBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPlayBtnActive: {
    backgroundColor: colors.accent,
  },
  miniPlayText: {
    color: colors.accentFg,
    fontSize: 10,
    marginLeft: 1,
  },
  miniPauseText: {
    color: colors.accentFg,
    fontSize: 9,
    fontWeight: '700',
  },
  off: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
})
