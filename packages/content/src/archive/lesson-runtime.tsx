import type { ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { MDXProvider } from '@mdx-js/react'
import { useMDXComponents } from '@/mdx-components'

/**
 * What every pre-rendered lesson page runs.
 *
 * It is deliberately the web app's own component map. A lesson is authored once
 * and has to read the same on both surfaces, and the way to guarantee that is
 * for both to render through the same file rather than through two that agree
 * today. See ./web-sources.ts.
 *
 * This is the whole of the page's JavaScript. The player, the navigation and
 * everything else the phone shows around a lesson are native and live outside
 * the WebView, which is what keeps the bridge as small as
 * docs/decisions/0034-lessons-are-pre-rendered-and-shown-in-a-webview.md says.
 */
function LessonPage({ Lesson }: { Lesson: ComponentType }) {
  return (
    <MDXProvider components={useMDXComponents()}>
      <Lesson />
    </MDXProvider>
  )
}

export function mountLesson(Lesson: ComponentType): void {
  const root = document.getElementById('lesson')
  if (!root) throw new Error('the page has no #lesson to render into')

  createRoot(root).render(<LessonPage Lesson={Lesson} />)
}
