import React, { useEffect, useState } from 'react'
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native'
import { colors, radius, space } from './theme'

export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = radius.control,
  style,
}: {
  width?: DimensionValue
  height?: DimensionValue
  borderRadius?: number
  style?: object
}) {
  const [opacity] = useState(() => new Animated.Value(0.35))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()

    return () => {
      animation.stop()
    }
  }, [opacity])

  return (
    <Animated.View
      style={[
        styles.box,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  )
}

/**
 * High-fidelity placeholder for the Track Screen while interactions
 * and topic calculations initialize.
 */
export function TrackSkeleton({ title }: { title?: string }) {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.trackHeader}>
        <View style={styles.trackInfoRow}>
          {title ? (
            <SkeletonBox width={140} height={28} borderRadius={radius.control} />
          ) : (
            <SkeletonBox width={180} height={28} borderRadius={radius.control} />
          )}
          <SkeletonBox width={65} height={24} borderRadius={radius.pill} />
        </View>

        {/* Audio control card skeleton */}
        <View style={styles.card}>
          <SkeletonBox width="60%" height={16} />
          <SkeletonBox width="40%" height={12} style={{ marginTop: space.xs }} />
        </View>

        <SkeletonBox width={120} height={14} style={{ marginTop: space.xs }} />
      </View>

      {/* List of topic card skeletons */}
      <View style={styles.topicsList}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.topicCard}>
            <View style={styles.topicTopRow}>
              <SkeletonBox width="55%" height={18} />
              <SkeletonBox width={50} height={18} borderRadius={radius.pill} />
            </View>
            <SkeletonBox width="92%" height={13} style={{ marginTop: space.sm }} />
            <SkeletonBox width="70%" height={13} style={{ marginTop: 4 }} />
            <View style={styles.topicBottomRow}>
              <SkeletonBox width={90} height={12} />
              <SkeletonBox width={70} height={12} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * High-fidelity placeholder for the Topic Screen while SQLite progress
 * reads and WebView document rendering initialize.
 */
export function TopicSkeleton() {
  return (
    <View style={styles.container}>
      {/* Top Narration bar skeleton */}
      <View style={styles.narrationBar}>
        <SkeletonBox width={36} height={36} borderRadius={18} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonBox width="65%" height={14} />
          <SkeletonBox width="40%" height={10} />
        </View>
      </View>

      {/* Lesson document skeleton */}
      <View style={styles.lessonDoc}>
        <SkeletonBox width="75%" height={28} style={{ marginBottom: space.sm }} />
        <SkeletonBox
          width={80}
          height={20}
          borderRadius={radius.pill}
          style={{ marginBottom: space.lg }}
        />

        <SkeletonBox width="95%" height={15} style={{ marginBottom: 6 }} />
        <SkeletonBox width="92%" height={15} style={{ marginBottom: 6 }} />
        <SkeletonBox width="88%" height={15} style={{ marginBottom: space.md }} />

        {/* Code block placeholder */}
        <View style={styles.codeBlock}>
          <SkeletonBox width="40%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonBox width="80%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBox width="65%" height={12} style={{ marginBottom: 6 }} />
          <SkeletonBox width="50%" height={12} />
        </View>

        <SkeletonBox width="94%" height={15} style={{ marginTop: space.md, marginBottom: 6 }} />
        <SkeletonBox width="85%" height={15} style={{ marginBottom: 6 }} />
        <SkeletonBox width="60%" height={15} style={{ marginBottom: space.md }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  box: {
    backgroundColor: colors.raised,
  },
  trackHeader: {
    padding: space.lg,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
  },
  topicsList: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
  },
  topicTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space.md,
    paddingTop: space.xs,
  },
  narrationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderBottomWidth: 1,
    padding: space.md,
    gap: space.md,
  },
  lessonDoc: {
    padding: space.lg,
  },
  codeBlock: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.md,
    marginVertical: space.sm,
  },
})
