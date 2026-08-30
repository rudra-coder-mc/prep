export type TopicTab = 'lesson' | 'practice' | 'exercises'

export type TopicTabItem = { tab: TopicTab; label: string; href: string }

export function topicTabItems(technology: string, directory: string): TopicTabItem[] {
  const base = `/topics/${technology}/${directory}`
  return [
    { tab: 'lesson', label: 'Lesson', href: base },
    { tab: 'practice', label: 'Practice', href: `${base}/practice` },
    { tab: 'exercises', label: 'Exercises', href: `${base}/exercises` },
  ]
}

/** Anything that is not a known sub-route belongs to the lesson. */
export function activeTopicTab(pathname: string, base: string): TopicTab {
  if (pathname === `${base}/practice`) return 'practice'
  if (pathname === `${base}/exercises`) return 'exercises'
  return 'lesson'
}
