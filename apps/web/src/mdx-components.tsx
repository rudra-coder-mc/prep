import { isValidElement, type ReactNode } from 'react'
import type { MDXComponents } from 'mdx/types'
// The leaf module rather than the barrel, which pulls the content schema and
// the whole of zod in behind it. Next drops that again, but the archive build
// bundles this file for the phone, where it was half the download and where
// `day.ts` reading process.env at module scope is a ReferenceError on load.
import { headingSlug } from '@prep/core/headings'
import {
  CallStack,
  CodeWalkthrough,
  ConceptMap,
  EventLoop,
  MemoryModel,
  PromiseTimeline,
  PrototypeChain,
  ScopeChain,
} from '@/components/visuals'

/**
 * A heading's own words, with its markup dropped. MDX hands a heading its
 * children rather than its text, so a heading with inline code in it arrives as
 * a string, an element and another string rather than as one heading.
 */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ''
}

/**
 * Everything a lesson can use. Visuals are in scope automatically, so an MDX
 * file never imports anything.
 */
export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    // The id is what a narration section points at, so the player can show
    // which part of the lesson it is talking about. `scroll-mt` is what keeps
    // that heading clear of the top bar when the page scrolls to it.
    h2: ({ children, ...props }) => (
      <h2
        id={headingSlug(textOf(children))}
        className="relative mt-12 scroll-mt-32 text-xl font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h2>
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
    ConceptMap,
    EventLoop,
    MemoryModel,
    PromiseTimeline,
    PrototypeChain,
    ScopeChain,
    ...components,
  }
}
