import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { DEFAULT_TIER, technologyLabel } from '@prep/core'
import { readAttemptsForTopics, readLearnedTopics } from '../../src/db/progress'
import { topicSummaries, type TopicSummary } from '../../src/library/tracks'
import { useApp } from '../../src/ui/app-state'
import { Muted, Waiting } from '../../src/ui/components'
import { STATUS_LABELS, statusColour } from '../../src/ui/status'
import { colors, radius, space } from '../../src/ui/theme'

/**
 * A track's topics and where each one stands.
 *
 * The status is @prep/core's `summariseTopic` over the attempts in SQLite, which
 * is the same function the web runs over the rows in Postgres. Nothing is
 * fetched: this screen is the reason the tables are mirrored rather than queried
 * over the network.
 */
export default function TrackScreen() {
  const { content, db, tiers } = useApp()
  const { technology } = useLocalSearchParams<{ technology: string }>()
  const [topics, setTopics] = useState<TopicSummary[] | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!content || !db || !technology) return

    void (async () => {
      const slugs = content.topics
        .filter((topic) => topic.technology === technology)
        .map((topic) => topic.slug)

      const [learned, attempts] = await Promise.all([
        readLearnedTopics(db),
        readAttemptsForTopics(db, slugs),
      ])
      if (cancelled) return

      setTopics(
        topicSummaries(content, technology, {
          tier: tiers.get(technology) ?? DEFAULT_TIER,
          learned,
          attempts,
        }),
      )
    })()

    return () => {
      cancelled = true
    }
  }, [content, db, technology, tiers])

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
})
