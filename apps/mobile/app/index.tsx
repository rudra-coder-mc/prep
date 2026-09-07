import { Redirect, Stack, useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'learn' | 'settings'>('learn')
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
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      {tab === 'learn' ? (
        <ScrollView
          contentContainerStyle={[
            styles.page,
            { paddingTop: Math.max(insets.top, space.md) + space.sm },
          ]}
        >
          <Text style={styles.brandTitle}>prep</Text>

          {!app.content ? (
            <Card>
              <Heading>No curriculum downloaded yet</Heading>
              <Muted>
                Download the study tracks and questions to prepare offline with zero lag.
              </Muted>
              <View style={styles.actions}>
                <Button label="Go to Settings & Sync" onPress={() => setTab('settings')} />
              </View>
            </Card>
          ) : null}

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

          {dashboard && dashboard.weakest.length > 0 ? (
            <View style={styles.section}>
              <Heading>Slipping</Heading>
              {dashboard.weakest.map((topic) => (
                <Pressable
                  key={topic.slug}
                  accessibilityRole="link"
                  onPress={() => router.push(`/topic/${topic.technology}/${topic.directory}`)}
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
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.page,
            { paddingTop: Math.max(insets.top, space.md) + space.sm },
          ]}
        >
          <Text style={styles.brandTitle}>Settings & Sync</Text>

          <View style={styles.section}>
            <Heading>Curriculum & Resources</Heading>
            <Card>
              <Heading>
                {app.content ? `Version ${app.content.version}` : 'No archive downloaded'}
              </Heading>
              <Muted>
                {app.content
                  ? 'All tracks, lessons, exercises, and questions run locally on this phone without network.'
                  : 'Download the curriculum once while connected, and study everywhere offline.'}
              </Muted>
              {refreshed ? <Muted>{refreshed}</Muted> : null}
              {app.problem ? <Problem>{app.problem}</Problem> : null}
              <View style={styles.actions}>
                <Button
                  label={app.content ? 'Check for updates & sync' : 'Download the curriculum'}
                  onPress={() => void refresh()}
                  busy={app.refreshing}
                />
              </View>
            </Card>
          </View>

          <View style={styles.section}>
            <Heading>Account & Server</Heading>
            <Card>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>User</Text>
                <Text style={styles.settingValue}>{app.session?.user.email ?? 'Unknown'}</Text>
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Server</Text>
                <Text style={styles.settingValue}>{app.session?.address ?? 'Not configured'}</Text>
              </View>
              {app.device ? (
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Device</Text>
                  <Text style={styles.settingValue}>{app.device.name}</Text>
                </View>
              ) : null}
            </Card>
          </View>

          <View style={styles.section}>
            <Heading>Session</Heading>
            <Card>
              <Muted>Signing out removes the current session from this device.</Muted>
              <View style={styles.actions}>
                <Button label="Sign out" tone="quiet" onPress={() => void app.signOut()} />
              </View>
            </Card>
          </View>
        </ScrollView>
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Learn tab"
          accessibilityState={{ selected: tab === 'learn' }}
          onPress={() => setTab('learn')}
          style={[styles.tabButton, tab === 'learn' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, tab === 'learn' && styles.tabLabelActive]}>Learn</Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Settings and resources tab"
          accessibilityState={{ selected: tab === 'settings' }}
          onPress={() => setTab('settings')}
          style={[styles.tabButton, tab === 'settings' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabLabel, tab === 'settings' && styles.tabLabelActive]}>
            Settings & Sync
          </Text>
        </Pressable>
      </View>
    </View>
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
  const router = useRouter()

  return (
    <View style={styles.track}>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push(`/track/${id}`)}
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
  screen: { flex: 1, backgroundColor: colors.bg },
  page: { padding: space.lg, gap: space.xl, paddingBottom: space.xl * 2 },
  brandTitle: {
    color: colors.fg,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.xs,
  },
  settingLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  settingValue: {
    color: colors.fg,
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.sm,
    borderRadius: radius.control,
  },
  tabButtonActive: {
    backgroundColor: colors.raised,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
})
