import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  DEFAULT_TIER,
  STATUS_LABELS,
  TIER_LABELS,
  nextTier,
  technologyLabel,
  type AttemptRecord,
  type Tier,
} from '@prep/core'
import { readAttemptsForTopics, readLearnedTopics } from '../../src/db/progress'
import { topicSummaries, type TopicSummary } from '../../src/library/tracks'
import { useApp } from '../../src/ui/app-state'
import { Button, Card, Muted } from '../../src/ui/components'
import { TrackSkeleton } from '../../src/ui/skeletons'
import { statusColour } from '../../src/ui/status'
import { colors, radius, space } from '../../src/ui/theme'
import { TrackAudio } from '../../src/ui/track-audio'

type ProgressCache = {
  revision: number
  learned: Map<string, Date>
  attempts: Map<string, AttemptRecord[]>
}

const progressCache = new Map<string, ProgressCache>()

/**
 * A track's topics and where each one stands.
 *
 * Scoped to the selected tier for instant opening and zero jank. Uses a
 * virtualized FlatList with memoized cards to render 30+ topics smoothly.
 */
export default function TrackScreen() {
  const app = useApp()
  const router = useRouter()
  const { client, content, db, files, tiers, defaultTier } = app
  const { technology } = useLocalSearchParams<{ technology: string }>()

  const selectedTier = technology ? tiers.get(technology) : undefined
  const tier: Tier = selectedTier || defaultTier || DEFAULT_TIER
  const [picking, setPicking] = useState(false)
  const [showAbove, setShowAbove] = useState(false)
  const [interactionsDone, setInteractionsDone] = useState(false)

  const title = technology ? technologyLabel(technology) : 'Track'

  // Allow native push transition to complete smoothly before loading heavy topic lists
  useEffect(() => {
    let finished = false
    const task = InteractionManager.runAfterInteractions(() => {
      if (!finished) {
        finished = true
        setInteractionsDone(true)
      }
    })
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true
        setInteractionsDone(true)
      }
    }, 250)

    return () => {
      finished = true
      task.cancel()
      clearTimeout(timer)
    }
  }, [])

  const [topics, setTopics] = useState<TopicSummary[]>(() => {
    if (!content || !technology) return []
    const cached = progressCache.get(technology)
    if (!cached) return []
    return topicSummaries(content, technology, {
      tier,
      learned: cached.learned,
      attempts: cached.attempts,
    })
  })

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (!content || !db || !technology) return

      const slugs = (content.technologies.find((t) => t.id === technology)?.topics ?? []).slice()

      void (async () => {
        const [learned, attempts] = await Promise.all([
          readLearnedTopics(db),
          readAttemptsForTopics(db, slugs),
        ])
        if (cancelled) return

        progressCache.set(technology, {
          revision: app.progressRevision,
          learned,
          attempts,
        })

        setTopics(topicSummaries(content, technology, { tier, learned, attempts }))
      })()

      return () => {
        cancelled = true
      }
    }, [content, db, technology, tier, app.progressRevision]),
  )

  const pick = useCallback(
    async (next: Tier) => {
      if (!technology || next === tier) return

      setPicking(true)
      try {
        await app.pickTier(technology, next)
      } finally {
        setPicking(false)
      }
    },
    [technology, tier, app],
  )

  const inScopeTopics = useMemo(() => topics.filter((t) => t.inScope), [topics])
  const aboveTopics = useMemo(() => topics.filter((t) => !t.inScope), [topics])
  const displayTopics = useMemo(
    () => (showAbove ? topics : inScopeTopics),
    [showAbove, topics, inScopeTopics],
  )

  const next = nextTier(tier)
  const isTierComplete =
    inScopeTopics.length > 0 &&
    inScopeTopics.every((t) => t.status === 'mastered' || t.status === 'understood')

  const renderItem = useCallback(
    ({ item }: { item: TopicSummary }) => (
      <TopicCard
        topic={item}
        onPress={() => router.push(`/topic/${technology}/${item.directory}`)}
      />
    ),
    [router, technology],
  )

  const listHeader = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle}>{title}</Text>
          <View style={styles.scopeBadge}>
            <Text style={styles.scopeBadgeText}>{TIER_LABELS[tier]}</Text>
          </View>
        </View>

        {content && files && technology ? (
          <TrackAudio content={content} files={files} client={client} technology={technology} />
        ) : null}

        <View style={styles.scopeHeader}>
          <Text style={styles.scopeCount}>
            {inScopeTopics.length} {inScopeTopics.length === 1 ? 'topic' : 'topics'} on{' '}
            {TIER_LABELS[tier]} path
          </Text>
        </View>
      </View>
    ),
    [title, tier, content, files, technology, client, inScopeTopics.length],
  )

  const listFooter = useMemo(
    () => (
      <View style={styles.footer}>
        {isTierComplete && next ? (
          <Card>
            <View style={styles.stepUpHead}>
              <Text style={styles.stepUpLead}>
                Ready for {TIER_LABELS[next]} in {title}
              </Text>
              <Muted>
                You have finished {TIER_LABELS[tier]}. Step up to {TIER_LABELS[next]} to enrol
                next-level interview questions.
              </Muted>
            </View>
            <View style={styles.stepUpAction}>
              <Button
                label={`Step up to ${TIER_LABELS[next]}`}
                onPress={() => void pick(next)}
                busy={picking}
              />
            </View>
          </Card>
        ) : null}

        {aboveTopics.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowAbove((prev) => !prev)}
            style={({ pressed }) => [styles.toggleAbove, pressed && styles.toggleAbovePressed]}
          >
            <Text style={styles.toggleAboveText}>
              {showAbove
                ? `Hide ${aboveTopics.length} topics introduced in later tiers`
                : `Show ${aboveTopics.length} topics introduced in later tiers`}
            </Text>
          </Pressable>
        ) : null}

        {displayTopics.length === 0 ? <Muted>No topics found on this path.</Muted> : null}
      </View>
    ),
    [
      isTierComplete,
      next,
      title,
      tier,
      picking,
      pick,
      aboveTopics.length,
      showAbove,
      displayTopics.length,
    ],
  )

  if (!interactionsDone && topics.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <TrackSkeleton title={title} />
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={displayTopics}
        keyExtractor={(item) => item.slug}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.page}
      />
    </>
  )
}

const TopicCard = React.memo(function TopicCard({
  topic,
  onPress,
}: {
  topic: TopicSummary
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${topic.title}, ${STATUS_LABELS[topic.status]}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.topic,
        !topic.inScope && styles.topicOutOfScope,
        pressed && styles.topicPressed,
      ]}
    >
      <View style={styles.head}>
        <Text style={[styles.title, !topic.inScope && styles.textMuted]}>{topic.title}</Text>
        <Text style={[styles.status, { color: statusColour[topic.status] }]}>
          {STATUS_LABELS[topic.status]}
        </Text>
      </View>

      <Text
        style={[styles.summary, !topic.inScope && styles.textMuted]}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {topic.summary}
      </Text>

      <View style={styles.meta}>
        <Text style={styles.counts}>
          {topic.inScope
            ? `${topic.questions} ${topic.questions === 1 ? 'question' : 'questions'}`
            : 'Introduced in later interview levels'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  )
})

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  header: { gap: space.md, marginBottom: space.sm },
  footer: { gap: space.md, marginTop: space.sm },
  trackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xs,
    paddingTop: space.xs,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.fg,
  },
  scopeBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
  },
  scopeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
  },
  scopeHeader: {
    paddingHorizontal: space.xs,
    paddingTop: space.xs,
  },
  scopeCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  stepUpHead: { gap: space.xs },
  stepUpLead: { color: colors.pass, fontSize: 14, fontWeight: '600' },
  stepUpAction: { marginTop: space.sm },
  toggleAbove: {
    padding: space.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  toggleAbovePressed: { backgroundColor: colors.raised },
  toggleAboveText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  topic: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  topicOutOfScope: {
    opacity: 0.6,
  },
  textMuted: {
    color: colors.muted,
  },
  topicPressed: { backgroundColor: colors.raised },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.fg, fontSize: 16, fontWeight: '600', flex: 1 },
  status: { fontSize: 12, fontWeight: '600' },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: space.xs,
  },
  counts: { color: colors.faint, fontSize: 12 },
  chevron: { color: colors.faint, fontSize: 18 },
})
