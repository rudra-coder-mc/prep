import { notFound } from 'next/navigation'
import { TopicNav } from '@/components/chrome/topic-nav'
import { getTopic } from '@/content'

type Params = { technology: string; topic: string }

/**
 * Wraps all three views of a topic so the tabs stay put while the content
 * underneath them changes.
 */
export default async function TopicLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<Params>
}) {
  const { technology, topic: directory } = await params
  const topic = await getTopic(technology, directory)
  if (!topic) notFound()

  return (
    <>
      <TopicNav technology={technology} directory={directory} title={topic.title} />
      {children}
    </>
  )
}
