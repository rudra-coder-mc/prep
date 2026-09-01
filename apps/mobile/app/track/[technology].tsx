import { Link, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DEFAULT_TIER, technologyLabel, type Tier } from '@prep/core'
import { readAttemptsForTopics, readLearnedTopics } from '../../src/db/progress'
import { topicSummaries, type TopicSummary } from '../../src/library/tracks'
import { useApp } from '../../src/ui/app-state'
import { Muted, Waiting } from '../../src/ui/components'
import { TierPicker } from '../../src/ui/tier-picker'
import { STATUS_LABELS, statusColour } from '../../src/ui/status'
import { colors, radius, space } from '../../src/ui/theme'
import { TrackAudio } from '../../src/ui/track-audio'

/**
 * A track's topics and where each one stands.
 *
 * The status is @prep/core's `summariseTopic` over the attempts in SQLite, which
 * is the same function the web runs over the rows in Postgres. Nothing is
 * fetched: this screen is the reason the tables are mirrored rather than queried
 * over the network.
 *
 * A topic opens its lesson, and marking it learned is done there, at the end of
 * the reading that earns it. It is read again on focus so a mark made in a
 * lesson shows on the way back.
 *
 * The audio card at the top is the track's recordings, which are downloaded a
 * track at a time rather than with the archive: see
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 *
 * The tier is picked here, beside the topics it decides the membership of. A
 * changed pick brings what is already learned up to it, which is why it goes
 * through the app rather than writing the row from this screen.
 */
export default function TrackScreen() {
  const app = useApp()
  const { client, content, db, files, tiers } = app
  const { technology } = useLocalSearchParams<{ technology: string }>()
  const [topics, setTopics] = useState<TopicSummary[] | null>(null)
  const [picking, setPicking] = useState(false)

  const tier = technology ? (tiers.get(technology) ?? DEFAULT_TIER) : DEFAULT_TIER

  useFocusEffect(
    useCallback(() => {
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

        setTopics(topicSummaries(content, technology, { tier, learned, attempts }))
      })()

      return () => {
        cancelled = true
      }
      // The revision is a dependency and not a value this reads: a sync landing
      // while this screen is open moves the statuses under it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, db, technology, tier, app.progressRevision]),
  )

  const title = technology ? technologyLabel(technology) : 'Track'

  async function pick(next: Tier) {
    if (!technology || next === tier) return

    setPicking(true)
    try {
      await app.pickTier(technology, next)
    } finally {
      setPicking(false)
    }
  }

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
        {technology ? (
          <View style={styles.picker}>
            <Muted>
              Preparing for an interview at which level. It decides which topics are on the path and
              which of their questions marking one learned enrols.
            </Muted>
            <TierPicker
              label={title}
              tier={tier}
              busy={picking}
              onPick={(next) => void pick(next)}
            />
          </View>
        ) : null}
        {content && files && technology ? (
          <TrackAudio content={content} files={files} client={client} technology={technology} />
        ) : null}
        {topics.length === 0 ? <Muted>This track has no topics in the archive.</Muted> : null}
        {topics.map((topic) => (
          <Link key={topic.slug} href={`/topic/${technology}/${topic.directory}`} asChild>
            <Pressable
              accessibilityRole="link"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
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
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.md },
  picker: { gap: space.sm },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.xs,
  },
  rowPressed: { backgroundColor: colors.raised },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.fg, fontSize: 17, fontWeight: '600', flex: 1 },
  status: { fontSize: 12, fontWeight: '600' },
  summary: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  meta: { color: colors.faint, fontSize: 12 },
})
