import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native'
import { colors, radius, space } from './theme'

/** The few pieces every screen is made of. Anything used once stays in its screen. */

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

export function Button({
  label,
  onPress,
  busy = false,
  disabled = false,
  tone = 'accent',
  compact = false,
  style,
}: {
  label: string
  onPress: () => void
  busy?: boolean
  disabled?: boolean
  tone?: 'accent' | 'quiet'
  compact?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const off = disabled || busy

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        tone === 'accent' ? styles.buttonAccent : styles.buttonQuiet,
        off && styles.buttonOff,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          size={compact ? 'small' : 'small'}
          color={tone === 'accent' ? colors.accentFg : colors.fg}
        />
      ) : (
        <Text
          style={[
            tone === 'accent' ? styles.buttonAccentText : styles.buttonQuietText,
            compact && styles.buttonCompactText,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  )
}

/**
 * Something that went wrong, said once. Failing to reach the server is the
 * ordinary case rather than an error, so nothing here shouts.
 */
export function Problem({ children }: { children: ReactNode }) {
  return (
    <View style={styles.problem}>
      <Text style={styles.problemText}>{children}</Text>
    </View>
  )
}

/**
 * A share of something, as a bar. The number is always beside it in the copy,
 * because a bar alone cannot say whether it is a share of ten or of six hundred.
 */
export function Bar({
  value,
  tone = 'accent',
  label,
}: {
  value: number
  tone?: 'accent' | 'pass' | 'weak'
  label: string
}) {
  const percent = Math.max(0, Math.min(100, value))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
      style={styles.bar}
    >
      <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: colors[tone] }]} />
    </View>
  )
}

export function Waiting({ label }: { label: string }) {
  return (
    <View style={styles.waiting}>
      <ActivityIndicator color={colors.accent} />
      <Muted>{label}</Muted>
    </View>
  )
}

const styles = StyleSheet.create({
  heading: { color: colors.fg, fontSize: 22, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  button: {
    borderRadius: radius.control,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonCompact: {
    minHeight: 38,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  buttonAccent: { backgroundColor: colors.accent },
  buttonQuiet: { backgroundColor: colors.raised, borderColor: colors.border, borderWidth: 1 },
  buttonOff: { opacity: 0.5 },
  buttonPressed: { opacity: 0.8 },
  buttonAccentText: { color: colors.accentFg, fontSize: 16, fontWeight: '600' },
  buttonQuietText: { color: colors.fg, fontSize: 16, fontWeight: '500' },
  buttonCompactText: { fontSize: 14 },
  problem: {
    backgroundColor: colors.raised,
    borderLeftColor: colors.weak,
    borderLeftWidth: 3,
    borderRadius: radius.control,
    padding: space.md,
  },
  problemText: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.raised,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
})
