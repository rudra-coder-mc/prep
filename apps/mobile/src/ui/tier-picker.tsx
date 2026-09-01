import { TIER_LABELS, TIERS, type Tier } from '@prep/core'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, space } from './theme'

/**
 * Picks the level of interview a track is being prepared for.
 *
 * The pick decides which topics are on the path and which of their questions
 * marking a topic learned enrols, so it sits with the track it applies to
 * rather than in a settings screen nobody opens. That is where the web puts it
 * too. See docs/decisions/0031-a-track-remembers-the-tier-you-picked.md.
 */
export function TierPicker({
  label,
  tier,
  busy = false,
  onPick,
}: {
  label: string
  tier: Tier
  busy?: boolean
  onPick: (tier: Tier) => void
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={`Preparing for ${label}`}
      style={[styles.group, busy && styles.busy]}
    >
      {TIERS.map((option) => {
        const active = option === tier

        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: busy }}
            disabled={busy}
            onPress={() => onPick(option)}
            style={({ pressed }) => [
              styles.option,
              active && styles.optionActive,
              pressed && styles.optionPressed,
            ]}
          >
            <Text style={active ? styles.labelActive : styles.label}>{TIER_LABELS[option]}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  busy: { opacity: 0.6 },
  option: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  optionActive: { backgroundColor: colors.accent },
  optionPressed: { opacity: 0.8 },
  label: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  labelActive: { color: colors.accentFg, fontSize: 13, fontWeight: '600' },
})
