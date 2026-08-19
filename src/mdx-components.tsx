import type { MDXComponents } from 'mdx/types'
import {
  CallStack,
  CodeWalkthrough,
  EventLoop,
  MemoryModel,
  PromiseTimeline,
  PrototypeChain,
  ScopeChain,
} from '@/components/visuals'

/**
 * Everything a lesson can use. Visuals are in scope automatically, so an MDX
 * file never imports anything.
 */
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h2: (props) => <h2 className="mt-10 text-lg font-semibold tracking-tight" {...props} />,
    h3: (props) => <h3 className="mt-6 font-medium" {...props} />,
    p: (props) => <p className="mt-4 leading-relaxed" {...props} />,
    ul: (props) => <ul className="mt-4 list-disc space-y-1 pl-5 leading-relaxed" {...props} />,
    ol: (props) => <ol className="mt-4 list-decimal space-y-1 pl-5 leading-relaxed" {...props} />,
    strong: (props) => <strong className="font-semibold text-[var(--color-fg)]" {...props} />,
    code: (props) => (
      <code
        className="rounded bg-[var(--color-surface)] px-1 py-0.5 font-mono text-[0.9em]"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="mt-4 overflow-x-auto rounded-lg bg-[var(--color-surface)] p-3 text-sm leading-6"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="mt-4 border-l-2 border-[var(--color-accent)] pl-4 text-[var(--color-muted)]"
        {...props}
      />
    ),
    CallStack,
    CodeWalkthrough,
    EventLoop,
    MemoryModel,
    PromiseTimeline,
    PrototypeChain,
    ScopeChain,
    ...components,
  }
}
