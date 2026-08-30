import { STATUS_LABELS, type TopicStatus } from '@prep/core'
import { colors } from './theme'

/**
 * How a topic's status is coloured. The labels are @prep/core's, so the two
 * surfaces call the same state the same thing.
 */
export const statusColour: Record<TopicStatus, string> = {
  not_started: colors.faint,
  learning: colors.accent,
  weak: colors.weak,
  understood: colors.pass,
  mastered: colors.pass,
}

export { STATUS_LABELS }
