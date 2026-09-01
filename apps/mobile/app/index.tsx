import { Link, Redirect, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { readSchedule } from '../src/db/schedule'
import { trackSummaries } from '../src/library/tracks'
import { buildReviewQueue } from '../src/review/queue'
import { useApp } from '../src/ui/app-state'
import { Button, Card, Heading, Muted, Problem, Waiting } from '../src/ui/components'
import { colors, radius, space } from '../src/ui/theme'

/**
 * The day, and what this device holds. It reads nothing over the network: the
 * queue, the tracks, their tiers and their question counts all come from the
 * archive and the mirrored tables.
 */
export default function HomeScreen() {
  const app = useApp()
  const router = useRouter()
  const [refreshed, setRefreshed] = useState<string | null>(null)
  const [today, setToday] = useState<{ dueToday: number; asking: number } | null>(null)

  const { content, db } = app

  // On focus rather than on mount, so finishing a session leaves a count that
  // has moved rather than the one the screen was built with.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (!content || !db) return

      void (async () => {
        const { items, dueToday } = buildReviewQueue(content, await readSchedule(db), new Date())
        if (!cancelled) setToday({ dueToday, asking: items.length })
      })()

      return () => {
        cancelled = true
      }
      // The revision is a dependency and not a value this reads: a sync landing
      // while this screen is open changes the rows behind the count, and
      // without it the number would stand until something else took focus.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, db, app.progressRevision]),
  )

  const tracks = useMemo(
    () => (app.content ? trackSummaries(app.content, app.tiers) : []),
    [app.content, app.tiers],
  )

  if (app.status === 'starting') return <Waiting label="Opening what this device holds" />
  if (app.status === 'signed-out') return <Redirect href="/sign-in" />

  async function refresh() {
    setRefreshed(null)
    const result = await app.refresh()
    if (!result) return
    setRefreshed(
      result.kind === 'current'
        ? 'Already the version the server has'
        : result.previous
          ? `Replaced ${result.previous} with ${result.version}`
          : `Downloaded ${result.version}`,
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {app.content && today ? (
        <Card>
          <Heading>{today.dueToday > 0 ? `${today.dueToday} due today` : 'Nothing due'}</Heading>
          <Muted>{describeToday(today)}</Muted>
          {today.asking > 0 ? (
            <View style={styles.actions}>
              <Button label="Start review" onPress={() => router.push('/review')} />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <Heading>{app.content ? 'Content' : 'Nothing downloaded yet'}</Heading>
        <Muted>
          {app.content
            ? `Version ${app.content.version}. This phone works with the server switched off.`
            : 'Refresh while the server is reachable, and everything after that works without it.'}
        </Muted>
        {refreshed ? <Muted>{refreshed}</Muted> : null}
        {app.problem ? <Problem>{app.problem}</Problem> : null}
        <View style={styles.actions}>
          <Button
            label={app.content ? 'Refresh' : 'Download the curriculum'}
            onPress={() => void refresh()}
            busy={app.refreshing}
          />
        </View>
      </Card>

      {tracks.length > 0 ? (
        <View style={styles.section}>
          <Heading>Tracks</Heading>
          {tracks.map((track) => (
            <Link key={track.id} href={`/track/${track.id}`} asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{track.label}</Text>
                  <Text style={styles.rowMeta}>
                    {track.topics} topics · {track.questions} questions at {track.tier}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Muted>
          {app.session?.user.email}
          {app.device ? ` · ${app.device.name}` : ''}
        </Muted>
        <Muted>{app.session?.address}</Muted>
        <Button label="Sign out" tone="quiet" onPress={() => void app.signOut()} />
      </View>
    </ScrollView>
  )
}

/**
 * The queue is not only what is due. Once everything due fits, it fills up with
 * the questions that have been going badly, so a day with nothing due still has
 * something worth doing and the card has to say which it is offering.
 */
function describeToday({ dueToday, asking }: { dueToday: number; asking: number }): string {
  if (asking === 0) return 'Mark a topic learned to put its questions into recall.'
  if (dueToday === 0) return `The queue offers ${asking} of your weakest, to keep them warm.`
  if (asking < dueToday) return `Today's queue asks ${asking} of them.`
  return 'Everything due is in the queue.'
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.xl },
  section: { gap: space.sm },
  actions: { marginTop: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.md,
  },
  rowPressed: { backgroundColor: colors.raised },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.fg, fontSize: 17, fontWeight: '600' },
  rowMeta: { color: colors.muted, fontSize: 13 },
  chevron: { color: colors.faint, fontSize: 22 },
  footer: { gap: space.sm, paddingTop: space.lg },
})
