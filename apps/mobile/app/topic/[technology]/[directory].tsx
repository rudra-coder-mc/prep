import { parseLessonMessage, sectionScript, themeScript } from '@prep/content/archive/bridge'
import { DEFAULT_TIER, questionsUpTo, TIER_LABELS } from '@prep/core'
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { openURL } from 'expo-linking'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { heldRecordings } from '../../../src/audio/library'
import { readLearnedTopics } from '../../../src/db/progress'
import { lessonUri } from '../../../src/lesson/expo'
import { resolveLessonLink } from '../../../src/lesson/links'
import { playableSections, type PlayableSection } from '../../../src/lesson/narration'
import { lessonOnDevice } from '../../../src/lesson/page'
import { lessonTheme } from '../../../src/lesson/theme'
import { findTopic } from '../../../src/library/tracks'
import { markTopicLearned } from '../../../src/library/learn'
import { useApp } from '../../../src/ui/app-state'
import { Button, Muted, Problem, Waiting } from '../../../src/ui/components'
import { Narration } from '../../../src/ui/narration'
import { colors, radius, space } from '../../../src/ui/theme'

/**
 * A lesson: the page the archive carries, in a WebView, with the player, the
 * navigation and the act of marking it learned native around it.
 *
 * The page is the same one the archive build compiled from the same MDX the web
 * renders, so a lesson reads and animates here the way it does on the laptop
 * rather than being written a second time. See
 * docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md.
 *
 * Four messages cross and no state. The page says when it is ready; this screen
 * answers with the colours it drew the chrome in and the heading the voice is
 * on; the page reports the links tapped inside it, and this screen navigates.
 * Nothing here reaches the network: the page, its script and the recordings are
 * all files on the device.
 */
export default function TopicScreen() {
  const app = useApp()
  const router = useRouter()
  const { technology, directory } = useLocalSearchParams<{
    technology: string
    directory: string
  }>()

  const page = useRef<WebView>(null)
  const [uri, setUri] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const [sections, setSections] = useState<PlayableSection[]>([])
  const [slug, setSlug] = useState<string | null>(null)
  const [learnedAt, setLearnedAt] = useState<Date | null>(null)
  const [marking, setMarking] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [footerMinimized, setFooterMinimized] = useState(false)
  const [showFooterInfo, setShowFooterInfo] = useState(false)

  const { content, db, files } = app
  const topic =
    content && technology && directory ? findTopic(content, technology, directory) : null
  const tier = technology ? (app.tiers.get(technology) ?? DEFAULT_TIER) : DEFAULT_TIER

  useEffect(() => {
    let cancelled = false
    if (!topic || !db || !files) return

    void (async () => {
      const path = await lessonOnDevice(db, files, topic)
      const keys = (topic.narration ?? []).map((section) => section.audioKey)
      const held = await heldRecordings(files, keys)
      const learned = await readLearnedTopics(db)
      if (cancelled) return

      setUri(path ? lessonUri(path) : null)
      setMissing(path === null)
      setSections(playableSections(topic, held))
      setLearnedAt(learned.get(topic.slug) ?? null)
    })()

    return () => {
      cancelled = true
    }
  }, [topic, db, files])

  // Sent unconditionally: the call is guarded on the page's side, so one that
  // arrives before the lesson has mounted does nothing rather than needing this
  // screen to track whether it has.
  useEffect(() => {
    page.current?.injectJavaScript(sectionScript(slug))
  }, [slug])

  const onSection = useCallback((next: string | null) => setSlug(next), [])

  function received(raw: string) {
    const message = parseLessonMessage(raw)
    if (!message || !content) return

    // The page keeps nothing, so it is told everything again every time it says
    // it is ready. A reload while a section is playing lands lit, not blank.
    if (message.type === 'ready') {
      page.current?.injectJavaScript(themeScript(lessonTheme()))
      page.current?.injectJavaScript(sectionScript(slug))
      return
    }

    const link = resolveLessonLink(content, message.href)
    if (link.kind === 'topic') router.push(`/topic/${link.technology}/${link.directory}`)
    else if (link.kind === 'external') void openURL(link.url)
    else setProblem('That link goes somewhere this device does not hold.')
  }

  async function markLearned() {
    if (!content || !db || !topic) return

    setMarking(true)
    setProblem(null)
    try {
      await markTopicLearned(db, content, topic.slug, tier, new Date())
      setLearnedAt(new Date())
    } catch (error) {
      setProblem(error instanceof Error ? error.message : String(error))
    } finally {
      setMarking(false)
    }
  }

  if (app.status === 'starting') return <Waiting label="Opening what this device holds" />
  if (app.status === 'signed-out') return <Redirect href="/sign-in" />
  if (!content) return <Redirect href="/" />

  if (!topic) {
    return (
      <View style={styles.empty}>
        <Stack.Screen options={{ title: 'Topic' }} />
        <Problem>This device holds no copy of that topic. Refresh the curriculum.</Problem>
      </View>
    )
  }

  const enrolling = questionsUpTo(topic.questions, tier).length

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: topic.title }} />

      {sections.length > 0 ? <Narration sections={sections} onSection={onSection} /> : null}
      {problem ? (
        <View style={styles.notice}>
          <Problem>{problem}</Problem>
        </View>
      ) : null}

      {missing ? (
        <View style={styles.empty}>
          <Problem>
            The archive on this device holds no page for this topic. Refresh the curriculum.
          </Problem>
        </View>
      ) : uri ? (
        <WebView
          ref={page}
          source={{ uri }}
          originWhitelist={['file://*']}
          // The page and everything it loads are files in the archive directory,
          // and its script is a module, which the WebView will not fetch from a
          // file without being told that a file may read one.
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          // Links are handed to this screen rather than followed, so the only
          // address the WebView is ever allowed to be at is the lesson it opened
          // with. The prefix is what keeps a link to a heading working.
          onShouldStartLoadWithRequest={(request) => request.url.startsWith(uri)}
          onMessage={(event) => received(event.nativeEvent.data)}
          style={styles.page}
        />
      ) : (
        <Waiting label="Opening the lesson" />
      )}

      {footerMinimized ? (
        <View style={styles.floatingFooter} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand lesson actions"
            onPress={() => setFooterMinimized(false)}
            style={({ pressed }) => [
              styles.floatingPill,
              learnedAt ? styles.floatingPillLearned : null,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.floatingPillText}>
              {learnedAt ? '✓ Learned' : '⚡ Mark learned'}
              {topic.exercises.length > 0 ? ` · ${topic.exercises.length} ex` : ''}
            </Text>
            <Text style={styles.floatingPillChevron}>▲</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.footer}>
          {showFooterInfo ? (
            <View style={styles.footerInfo}>
              <Muted>
                {enrolling > 0
                  ? `Marking it learned puts its ${enrolling} questions at ${TIER_LABELS[tier]} or below into recall.`
                  : `This topic is asked above ${TIER_LABELS[tier]}, so marking it learned enrols nothing yet.`}
              </Muted>
            </View>
          ) : null}

          <View style={styles.footerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Minimize action bar to read in full screen"
              onPress={() => setFooterMinimized(true)}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Text style={styles.chevronIcon}>▼</Text>
            </Pressable>

            <View style={styles.footerActions}>
              <View style={styles.actionBtnWrapper}>
                <Button
                  compact
                  label={learnedAt ? 'Read again' : 'Mark learned'}
                  onPress={() => void markLearned()}
                  busy={marking}
                />
              </View>
              {topic.exercises.length > 0 ? (
                <View style={styles.actionBtnWrapper}>
                  <Button
                    compact
                    label={`${topic.exercises.length} exercises`}
                    tone="quiet"
                    onPress={() => router.push(`/topic/${technology}/${directory}/exercises`)}
                  />
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showFooterInfo ? 'Hide details' : 'Show details'}
              onPress={() => setShowFooterInfo((prev) => !prev)}
              style={({ pressed }) => [
                styles.iconBtn,
                showFooterInfo && styles.iconBtnActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.infoIcon, showFooterInfo && styles.infoIconActive]}>ⓘ</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  // The WebView paints white until the page does, and the page is dark.
  page: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, padding: space.lg },
  notice: { padding: space.md, paddingBottom: 0 },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    gap: space.xs,
  },
  footerInfo: {
    paddingHorizontal: space.sm,
    paddingTop: space.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  footerActions: {
    flex: 1,
    flexDirection: 'row',
    gap: space.xs,
  },
  actionBtnWrapper: {
    flex: 1,
  },
  iconBtn: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
  },
  iconBtnActive: {
    backgroundColor: colors.raised,
  },
  chevronIcon: {
    color: colors.faint,
    fontSize: 12,
  },
  infoIcon: {
    color: colors.muted,
    fontSize: 16,
  },
  infoIconActive: {
    color: colors.accent,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: space.md,
    right: space.md,
    zIndex: 20,
    elevation: 6,
  },
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    gap: space.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  floatingPillLearned: {
    borderColor: colors.pass,
  },
  floatingPillText: {
    color: colors.fg,
    fontSize: 12,
    fontWeight: '500',
  },
  floatingPillChevron: {
    color: colors.accent,
    fontSize: 10,
  },
  pressed: {
    opacity: 0.7,
  },
})
