'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { QUICK, SETTLE, StepNote, useSearchProbe, useVisualNamespace } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type ScopeStep = {
  note: string
  /** Outermost scope first. */
  scopes: { name: string; bindings: Record<string, string> }[]
  /** A name being resolved, and which scope answered. */
  lookup?: { name: string; foundIn?: string }
}

export function ScopeChain({
  title = 'Scope chain',
  steps,
}: {
  title?: string
  steps: ScopeStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const namespace = useVisualNamespace()
  const step = steps[player.index]
  const scopes = step?.scopes ?? []
  const lookup = step?.lookup

  const answerAt = lookup?.foundIn ? scopes.findIndex((scope) => scope.name === lookup.foundIn) : -1
  // With no answer the search runs all the way out to the global scope.
  const probe = useSearchProbe(
    Math.max(scopes.length - 1, 0),
    answerAt === -1 ? 0 : answerAt,
    player.index,
    lookup !== undefined && !reducedMotion,
  )

  return (
    <VisualFrame title={title} player={player}>
      <div className="space-y-2">
        {scopes.map((scope, depth) => {
          const isAnswer = depth === answerAt
          const isProbing = lookup !== undefined && depth === probe
          // Scopes nearer the lookup are searched first, so shade by depth.
          const isSearched = lookup !== undefined && depth >= (answerAt === -1 ? 0 : answerAt)

          return (
            <motion.div
              key={scope.name}
              layout={!reducedMotion}
              transition={SETTLE}
              data-scope={scope.name}
              data-answer={isAnswer || undefined}
              style={{ marginLeft: `${depth * 14}px` }}
              className={cx(
                'relative rounded-lg border p-2',
                isAnswer ? 'border-accent' : 'border-border',
                !isSearched && !isAnswer ? 'opacity-60' : '',
              )}
            >
              {isProbing ? (
                <motion.span
                  aria-hidden
                  layoutId={`${namespace}-probe`}
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  className={cx(
                    'pointer-events-none absolute inset-0 rounded-lg ring-2',
                    isAnswer ? 'ring-accent' : 'ring-edge',
                  )}
                />
              ) : null}

              <div className="flex items-center gap-2">
                <h4 className="font-mono text-xs text-muted">{scope.name}</h4>
                <AnimatePresence>
                  {isProbing && !isAnswer ? (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={QUICK}
                      className="font-mono text-[0.65rem] text-faint"
                    >
                      searching&hellip;
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              <ul className="mt-1 flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(scope.bindings).length === 0 ? (
                  <li className="text-muted">no bindings</li>
                ) : (
                  Object.entries(scope.bindings).map(([name, value]) => {
                    const isMatch = lookup?.name === name && isAnswer

                    return (
                      <motion.li
                        key={name}
                        data-binding={name}
                        animate={
                          isMatch
                            ? { scale: [1, 1.14, 1], color: 'var(--color-accent)' }
                            : { scale: 1, color: 'var(--color-fg)' }
                        }
                        transition={SETTLE}
                        className="rounded bg-bg px-1.5 py-0.5"
                      >
                        {name} = {value}
                      </motion.li>
                    )
                  })
                )}
              </ul>
            </motion.div>
          )
        })}
      </div>

      {lookup ? (
        <motion.p
          key={`${player.index}-lookup`}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SETTLE}
          className="mt-3 font-mono text-xs text-muted"
        >
          resolving <span className="text-fg">{lookup.name}</span>
          {lookup.foundIn ? (
            <span className="text-accent"> &rarr; found in {lookup.foundIn}</span>
          ) : (
            <span className="text-fail"> &rarr; not found</span>
          )}
        </motion.p>
      ) : null}

      <StepNote
        note={step?.note ?? ''}
        stepKey={player.index}
        direction={player.direction}
        reducedMotion={reducedMotion}
      />
    </VisualFrame>
  )
}
