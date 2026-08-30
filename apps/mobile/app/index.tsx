import { Link, Redirect } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { trackSummaries } from '../src/library/tracks'
import { useApp } from '../src/ui/app-state'
import { Button, Card, Heading, Muted, Problem, Waiting } from '../src/ui/components'
import { colors, radius, space } from '../src/ui/theme'

/**
 * What this device holds, which is the whole of what it can tell you before the
 * queue exists. It reads nothing over the network: the tracks, their tiers and
 * their question counts all come from the archive and the mirrored tables.
 */
export default function HomeScreen() {
  const app = useApp()
  const [refreshed, setRefreshed] = useState<string | null>(null)

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
