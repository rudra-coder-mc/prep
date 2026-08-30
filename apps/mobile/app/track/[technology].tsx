import { Stack, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DEFAULT_TIER, technologyLabel } from '@prep/core'
import { readAttemptsForTopics, readLearnedTopics } from '../../src/db/progress'
import { markTopicLearned } from '../../src/library/learn'
import { topicSummaries, type TopicSummary } from '../../src/library/tracks'
import { useApp } from '../../src/ui/app-state'
import { Muted, Problem, Waiting } from '../../src/ui/components'
import { STATUS_LABELS, statusColour } from '../../src/ui/status'
import { colors, radius, space } from '../../src/ui/theme'

/**
 * A track's topics, where each one stands, and the act that puts one into
 * recall.
 *
 * The status is @prep/core's `summariseTopic` over the attempts in SQLite, which
 * is the same function the web runs over the rows in Postgres. Nothing is
 * fetched: this screen is the reason the tables are mirrored rather than queried
 * over the network.
 *
 * Marking a topic learned enrols the questions the track's tier covers, and
 * doing it again is free. Until task 32 the lesson itself is on the laptop, so
 * this is where the mark is made rather than at the end of a lesson.
 */
export default function TrackScreen() {
  const { content, db, tiers } = useApp()
  const { technology } = useLocalSearchParams<{ technology: string }>()
  const [topics, setTopics] = useState<TopicSummary[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)

  const tier = technology ? (tiers.get(technology) ?? DEFAULT_TIER) : DEFAULT_TIER

  const load = useCallback(async () => {
    if (!content || !db || !technology) return null

    const slugs = content.topics
      .filter((topic) => topic.technology === technology)
      .map((topic) => topic.slug)

    const [learned, attempts] = await Promise.all([
      readLearnedTopics(db),
      readAttemptsForTopics(db, slugs),
    ])

    return topicSummaries(content, technology, { tier, learned, attempts })
  }, [content, db, technology, tier])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const summaries = await load()
      if (!cancelled && summaries) setTopics(summaries)
    })()

    return () => {
      cancelled = true
    }
  }, [load])

  async function markLearned(topicSlug: string) {
    if (!content || !db) return

    setMarking(topicSlug)
    setProblem(null)
    try {
      await markTopicLearned(db, content, topicSlug, tier, new Date())
      setTopics(await load())
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error))
    } finally {
      setMarking(null)
    }
  }

  const title = technology ? technologyLabel(technology) : 'Track'

  if (!topics) {
    return (
      <>
        <Stack.Screen options={{ title }} />
        <Waiting label="Reading what this device holds" />
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.page}>
        {problem ? <Problem>{problem}</Problem> : null}
        {topics.length === 0 ? <Muted>This track has no topics in the archive.</Muted> : null}
        {topics.map((topic) => (
          <View key={topic.slug} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.title}>{topic.title}</Text>
              <Text style={[styles.status, { color: statusColour[topic.status] }]}>
                {STATUS_LABELS[topic.status]}
              </Text>
            </View>
            <Text style={styles.summary}>{topic.summary}</Text>
            <Text style={styles.meta}>
              {topic.questions} questions · {topic.progress}% passing
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: marking === topic.slug }}
              disabled={marking !== null}
              onPress={() => void markLearned(topic.slug)}
              style={({ pressed }) => [styles.learn, pressed && styles.learnPressed]}
            >
              <Text style={styles.learnText}>
                {topic.learnedAt ? 'Read again, and re-enrol' : 'Mark learned'}
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.md },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.xs,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.fg, fontSize: 17, fontWeight: '600', flex: 1 },
  status: { fontSize: 12, fontWeight: '600' },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.faint, fontSize: 12 },
  learn: {
    marginTop: space.sm,
    alignSelf: 'flex-start',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  learnPressed: { backgroundColor: colors.raised },
  learnText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
})
