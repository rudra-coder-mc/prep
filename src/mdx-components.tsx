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
    h2: (props) => (
      <h2 className="mt-12 scroll-mt-32 text-xl font-semibold tracking-tight" {...props} />
    ),
    h3: (props) => <h3 className="mt-8 scroll-mt-32 font-medium" {...props} />,
    p: (props) => <p className="mt-4 leading-7 text-fg/90" {...props} />,
    ul: (props) => (
      <ul className="mt-4 list-disc space-y-1.5 pl-5 leading-7 marker:text-faint" {...props} />
    ),
    ol: (props) => (
      <ol className="mt-4 list-decimal space-y-1.5 pl-5 leading-7 marker:text-faint" {...props} />
    ),
    li: (props) => <li className="pl-1" {...props} />,
    hr: () => <hr className="my-10 border-border" />,
    a: (props) => (
      <a className="text-accent underline underline-offset-4 hover:no-underline" {...props} />
    ),
    strong: (props) => <strong className="font-semibold text-fg" {...props} />,
    code: (props) => (
      <code
        className="rounded border border-border bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className="mt-5 overflow-x-auto rounded-card border border-border bg-surface p-4 font-mono text-sm leading-6 [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="mt-5 rounded-r-lg border-l-2 border-accent bg-accent-dim/40 py-2 pl-4 text-muted"
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
