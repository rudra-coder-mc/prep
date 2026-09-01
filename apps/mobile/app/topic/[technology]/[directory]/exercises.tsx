import { exerciseKey, type Exercise } from '@prep/core'
import { Redirect, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  readTopicExercises,
  setExerciseStatus,
  type ExerciseRow,
} from '../../../../src/db/exercises'
import { findTopic } from '../../../../src/library/tracks'
import { useApp } from '../../../../src/ui/app-state'
import { Button, Muted, Problem, Waiting } from '../../../../src/ui/components'
import { colors, radius, space } from '../../../../src/ui/theme'

/**
 * A topic's exercises, and how each one went.
 *
 * Nothing runs here and nothing is graded. An exercise is solved in an editor
 * and the platform is only ever told the outcome, which is why this is the one
 * part of the loop a sync carries as state rather than rebuilding from
 * attempts. See ../../../../src/db/exercises.ts.
 */
export default function ExercisesScreen() {
  const app = useApp()
  const { technology, directory } = useLocalSearchParams<{
    technology: string
    directory: string
  }>()

  const [progress, setProgress] = useState<Map<string, ExerciseRow> | null>(null)

  const { content, db } = app
  const topic =
    content && technology && directory ? findTopic(content, technology, directory) : null
  const slug = topic?.slug ?? null

  // On focus rather than on mount, so a sync that landed while this screen was
  // covered shows what it brought.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (!content || !db || !technology || !directory) return

      void (async () => {
        const found = findTopic(content, technology, directory)
        if (!found) return

        const rows = await readTopicExercises(db, found.slug)
        if (!cancelled) setProgress(rows)
      })()

      return () => {
        cancelled = true
      }
      // The revision is a dependency and not a value this reads: a sync landing
      // while this screen is open changes the rows behind it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content, db, technology, directory, app.progressRevision]),
  )

  if (app.status === 'starting') return <Waiting label="Opening what this device holds" />
  if (app.status === 'signed-out') return <Redirect href="/sign-in" />
  if (!content) return <Redirect href="/" />

  if (!topic) {
    return (
      <View style={styles.empty}>
        <Stack.Screen options={{ title: 'Exercises' }} />
        <Problem>This device holds no copy of that topic. Refresh the curriculum.</Problem>
      </View>
    )
  }

  if (!progress) {
    return (
      <>
        <Stack.Screen options={{ title: 'Exercises' }} />
        <Waiting label="Reading what this device holds" />
      </>
    )
  }

  async function save(exerciseId: string, status: ExerciseRow['status'], notes: string) {
    if (!db || !slug) return

    await setExerciseStatus(db, { topicSlug: slug, exerciseId, status, notes }, new Date())
    setProgress(await readTopicExercises(db, slug))
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Exercises' }} />
      <ScrollView contentContainerStyle={styles.page}>
        <Muted>Solve these in your editor, then record how it went. Nothing runs here.</Muted>

        {topic.exercises.length === 0 ? <Muted>This topic has no exercises.</Muted> : null}

        {topic.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            row={progress.get(exerciseKey(topic.slug, exercise.id)) ?? null}
            onSave={(status, notes) => save(exercise.id, status, notes)}
          />
        ))}
      </ScrollView>
    </>
  )
}

function ExerciseCard({
  exercise,
  row,
  onSave,
}: {
  exercise: Exercise
  row: ExerciseRow | null
  onSave: (status: ExerciseRow['status'], notes: string) => Promise<void>
}) {
  const completed = row?.status === 'completed'
  const [notes, setNotes] = useState(row?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function save(status: ExerciseRow['status']) {
    setSaving(true)
    try {
      await onSave(status, notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={[styles.card, completed && styles.cardDone]}>
      <View style={styles.head}>
        <Text style={styles.title}>{exercise.title}</Text>
        <Text style={styles.difficulty}>{exercise.difficulty}</Text>
      </View>

      <Text style={styles.prompt}>{exercise.prompt}</Text>

      <Text style={styles.label}>Requirements</Text>
      {exercise.requirements.map((requirement) => (
        <View key={requirement} style={styles.requirement}>
          <View style={styles.bullet} />
          <Text style={styles.requirementText}>{requirement}</Text>
        </View>
      ))}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        accessibilityLabel={`Notes for ${exercise.title}`}
        placeholder="What was awkward? What would you do differently?"
        placeholderTextColor={colors.faint}
        style={styles.notes}
      />

      {completed ? (
        <>
          <Text style={styles.done}>Completed</Text>
          <Button
            label="Reopen"
            tone="quiet"
            busy={saving}
            onPress={() => void save('in_progress')}
          />
        </>
      ) : (
        <>
          <Button label="Mark complete" busy={saving} onPress={() => void save('completed')} />
          <Button
            label="Save notes"
            tone="quiet"
            busy={saving}
            onPress={() => void save('in_progress')}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { padding: space.lg, gap: space.md },
  empty: { flex: 1, padding: space.lg },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.sm,
  },
  cardDone: { borderColor: colors.pass },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { color: colors.fg, fontSize: 17, fontWeight: '600', flex: 1 },
  difficulty: {
    color: colors.faint,
    fontSize: 12,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    textTransform: 'capitalize',
  },
  prompt: { color: colors.fg, fontSize: 15, lineHeight: 22 },
  label: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: space.sm,
  },
  requirement: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.edge,
    marginTop: 8,
  },
  requirementText: { color: colors.muted, fontSize: 14, lineHeight: 20, flex: 1 },
  notes: {
    color: colors.fg,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.control,
    padding: space.md,
  },
  done: { color: colors.pass, fontSize: 14, fontWeight: '600' },
})
