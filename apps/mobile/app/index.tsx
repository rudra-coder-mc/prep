import { Link, Redirect, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { STATUS_LABELS, TIER_LABELS, type Dashboard, type TopicStatus, type Tier } from '@prep/core'
import { readSchedule } from '../src/db/schedule'
import { readDashboard } from '../src/library/dashboard'
import { trackSummaries } from '../src/library/tracks'
import { buildReviewQueue } from '../src/review/queue'
import { useApp } from '../src/ui/app-state'
import { Bar, Button, Card, Heading, Muted, Problem, Waiting } from '../src/ui/components'
import { statusColour } from '../src/ui/status'
import { colors, radius, space } from '../src/ui/theme'

/**
 * The day, the promise, and what this device holds. It reads nothing over the
 * network: the queue, the readiness, the streak and every count come from the
 * archive and the mirrored tables.
 *
 * Every number here is @prep/core's `summariseDashboard` over those tables,
 * which is the same fold the web runs over the same rows in Postgres, so once a
 * sync has run the two dashboards agree.
 */
export default function HomeScreen() {
  const app = useApp()
  const router = useRouter()
  const [refreshed, setRefreshed] = useState<string | null>(null)
  const [today, setToday] = useState<{ dueToday: number; asking: number } | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)

  const { content, db } = app

  // On focus rather than on mount, so finishing a session leaves counts that
  // have moved rather than the ones the screen was built with.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (!content || !db) return

      void (async () => {
        const { items, dueToday } = buildReviewQueue(content, await readSchedule(db), new Date())
        const summary = await readDashboard(db, content)
        if (cancelled) return

        setToday({ dueToday, asking: items.length })
        setDashboard(summary)
      })()

      return () => {
        cancelled = true
      }
      // The revision is a dependency and not a value this reads: a sync landing
      // while this screen is open changes the rows behind the counts, and
      // without it they would stand until something else took focus.
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

  const readiness = new Map((dashboard?.tracks ?? []).map((track) => [track.id, track]))

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {app.content && today ? (
        <Card>
          <View style={styles.todayHead}>
            <View style={styles.todayText}>
              <Heading>
                {today.dueToday > 0 ? `${today.dueToday} due today` : 'Nothing due'}
              </Heading>
              <Muted>{describeToday(today)}</Muted>
            </View>
            {dashboard ? <Streak streak={dashboard.streak} /> : null}
          </View>
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
          <Heading>Readiness</Heading>
          {tracks.map((track) => (
            <TrackRow
              key={track.id}
              id={track.id}
              label={track.label}
              tier={track.tier}
              topics={track.topics}
              ready={readiness.get(track.id)}
              onStepUp={(tier) => void app.pickTier(track.id, tier)}
            />
          ))}
        </View>
      ) : null}

      {dashboard ? (
        <View style={styles.section}>
          <Heading>Where it stands</Heading>
          <Card>
            {STATUS_ORDER.map((status) => (
              <Stat
                key={status}
                dot={statusColour[status]}
                label={STATUS_LABELS[status]}
                value={dashboard.byStatus[status]}
              />
            ))}
          </Card>
          <Card>
            <Stat label="Questions answered" value={dashboard.questions.attempted} />
            <Stat label="Passed" value={dashboard.questions.passed} />
            <Stat label="Weak" value={dashboard.questions.weak} />
            <Stat label="Failed" value={dashboard.questions.failed} />
            <Stat label="Exercises completed" value={dashboard.exercises.completed} />
            <Stat label="Exercises remaining" value={dashboard.exercises.remaining} />
          </Card>
        </View>
      ) : null}

      {dashboard && dashboard.weakest.length > 0 ? (
        <View style={styles.section}>
          <Heading>Slipping</Heading>
          {dashboard.weakest.map((topic) => (
            <Link key={topic.slug} href={`/topic/${topic.technology}/${topic.directory}`} asChild>
              <Pressable
                accessibilityRole="link"
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.rowHead}>
                  <Text style={styles.rowTitle}>{topic.title}</Text>
                  <Text style={[styles.status, { color: statusColour[topic.status] }]}>
                    {STATUS_LABELS[topic.status]}
                  </Text>
                </View>
                <Bar value={topic.progress} tone="weak" label={`${topic.title} progress`} />
                <Text style={styles.rowMeta}>{topic.progress}% of its questions passing</Text>
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

const STATUS_ORDER: TopicStatus[] = ['mastered', 'understood', 'learning', 'weak', 'not_started']

function Streak({ streak }: { streak: { current: number; longest: number } }) {
  return (
    <View style={styles.streak}>
      <Text style={styles.streakCount}>{streak.current}</Text>
      <Text style={styles.streakLabel}>
        day streak
        {streak.longest > streak.current ? ` · best ${streak.longest}` : ''}
      </Text>
    </View>
  )
}

/**
 * One track: where it goes, and how ready it is for the tier picked on it.
 *
 * A track with no readiness has no questions the pick covers, so there is
 * nothing to be ready for. It is still listed, because its lessons are still
 * worth reading and its tier is still changeable from the screen behind it.
 */
function TrackRow({
  id,
  label,
  tier,
  topics,
  ready,
  onStepUp,
}: {
  id: string
  label: string
  tier: Tier
  topics: number
  ready: Dashboard['tracks'][number] | undefined
  onStepUp: (tier: Tier) => void
}) {
  return (
    <View style={styles.track}>
      <Link href={`/track/${id}`} asChild>
        <Pressable
          accessibilityRole="link"
          style={({ pressed }) => [styles.trackHead, pressed && styles.rowPressed]}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{label}</Text>
            {/* The readiness line below carries the counts when there is one,
                so this says the thing that line cannot: that a track with
                nothing at the pick still has lessons worth reading. */}
            <Text style={styles.rowMeta}>
              {ready
                ? `Preparing for ${TIER_LABELS[tier]}`
                : `${topics} topics, none asked at ${TIER_LABELS[tier]}`}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </Link>

      {ready ? (
        <View style={styles.trackReady}>
          <Bar
            value={ready.readiness.percent}
            tone="pass"
            label={`${label} readiness for ${TIER_LABELS[tier]}`}
          />
          {/* The count carries the share, because a tier this bank is thin at
              would otherwise read as a confident percentage of almost nothing. */}
          <Text style={styles.rowMeta}>
            {ready.readiness.percent}% ready · {ready.readiness.retained} of {ready.readiness.total}{' '}
            questions retained · {ready.started} of {ready.total} topics started
          </Text>
          {ready.readiness.stepUpTo ? (
            <StepUp
              label={label}
              from={tier}
              to={ready.readiness.stepUpTo}
              adds={ready.readiness.stepUpAdds}
              onPick={onStepUp}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

/**
 * The offer a finished tier makes. It says what accepting it costs, because
 * stepping up enrols the whole of the next tier at once and the queue it lands
 * in is the thing that takes time every morning. Nothing advances on its own.
 * See docs/decisions/0028-tiers-are-interview-levels.md.
 */
function StepUp({
  label,
  from,
  to,
  adds,
  onPick,
}: {
  label: string
  from: Tier
  to: Tier
  adds: number
  onPick: (tier: Tier) => void
}) {
  return (
    <View style={styles.stepUp}>
      <Text style={styles.stepUpLead}>
        You are ready for {TIER_LABELS[from]} in {label}.
      </Text>
      <Muted>
        {TIER_LABELS[to]} adds {adds} questions to your recall queue, at the bottom of the ladder.
        Nothing you have already learned moves.
      </Muted>
      <Button label={`Step up to ${TIER_LABELS[to]}`} onPress={() => onPick(to)} />
    </View>
  )
}

function Stat({ label, value, dot }: { label: string; value: number; dot?: string }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statLabel}>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
        <Text style={styles.statText}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
  todayHead: { flexDirection: 'row', alignItems: 'flex-start', gap: space.lg },
  todayText: { flex: 1, gap: space.sm },
  streak: { alignItems: 'flex-end' },
  streakCount: { color: colors.fg, fontSize: 34, fontWeight: '600', lineHeight: 36 },
  streakLabel: { color: colors.muted, fontSize: 11 },
  track: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  trackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.lg,
    gap: space.md,
  },
  trackReady: { paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.sm },
  stepUp: {
    backgroundColor: colors.raised,
    borderLeftColor: colors.pass,
    borderLeftWidth: 3,
    borderRadius: radius.control,
    padding: space.md,
    gap: space.sm,
  },
  stepUpLead: { color: colors.pass, fontSize: 14, fontWeight: '600' },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  rowPressed: { backgroundColor: colors.raised },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: colors.fg, fontSize: 17, fontWeight: '600', flex: 1 },
  rowMeta: { color: colors.faint, fontSize: 12, lineHeight: 17 },
  status: { fontSize: 12, fontWeight: '600' },
  chevron: { color: colors.faint, fontSize: 22 },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.xs,
  },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 },
  statText: { color: colors.muted, fontSize: 14 },
  statValue: { color: colors.fg, fontSize: 14, fontWeight: '600' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  footer: { gap: space.sm, paddingTop: space.lg },
})
