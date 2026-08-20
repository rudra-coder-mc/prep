'use client'

import { motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { QUICK, SETTLE, StepNote, useSearchProbe, useVisualNamespace } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type PrototypeStep = {
  note: string
  /** The object being used first, then each prototype in turn. */
  chain: { id: string; label: string; properties: string[] }[]
  /** A property being looked up, and where it was found. */
  lookup?: { property: string; foundIn?: string }
}

/** The `__proto__` hop between two links, lit as the search crosses it. */
function ProtoLink({ crossed, reducedMotion }: { crossed: boolean; reducedMotion: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-4">
      <div className="relative h-5 w-px bg-border">
        <motion.div
          initial={reducedMotion ? false : { scaleY: 0 }}
          animate={{ scaleY: crossed ? 1 : 0 }}
          transition={SETTLE}
          style={{ transformOrigin: 'top' }}
          className="absolute inset-0 bg-accent"
        />
      </div>
      <motion.span
        animate={{
          opacity: crossed ? 1 : 0.45,
          color: crossed ? 'var(--color-accent)' : undefined,
        }}
        transition={QUICK}
        className="font-mono text-xs text-muted"
      >
        &darr; __proto__
      </motion.span>
    </div>
  )
}

export function PrototypeChain({
  title = 'Prototype chain',
  steps,
}: {
  title?: string
  steps: PrototypeStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const namespace = useVisualNamespace()
  const step = steps[player.index]
  const chain = step?.chain ?? []
  const lookup = step?.lookup

  const foundAt = lookup?.foundIn ? chain.findIndex((link) => link.id === lookup.foundIn) : -1
  // A property nobody owns is searched to the end of the chain.
  const probe = useSearchProbe(
    0,
    foundAt === -1 ? Math.max(chain.length - 1, 0) : foundAt,
    player.index,
    lookup !== undefined && !reducedMotion,
  )

  return (
    <VisualFrame title={title} player={player}>
      <ol>
        {chain.map((link, depth) => {
          const isAnswer = depth === foundAt
          // Everything before the answer was searched and missed.
          const wasSearched = lookup !== undefined && (foundAt === -1 || depth <= foundAt)
          const isProbing = lookup !== undefined && depth === probe

          return (
            <li key={link.id} data-link={link.id} data-answer={isAnswer || undefined}>
              {depth > 0 ? (
                <ProtoLink
                  crossed={lookup !== undefined && probe >= depth}
                  reducedMotion={reducedMotion}
                />
              ) : null}

              <motion.div
                layout={!reducedMotion}
                transition={SETTLE}
                className={cx(
                  'relative rounded-lg border p-2',
                  isAnswer ? 'border-accent' : 'border-border',
                  !wasSearched ? 'opacity-60' : '',
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

                <h4 className="font-mono text-xs text-muted">{link.label}</h4>
                <ul className="mt-1 flex flex-wrap gap-2 font-mono text-xs">
                  {link.properties.length === 0 ? (
                    <li className="text-muted">no own properties</li>
                  ) : (
                    link.properties.map((property) => {
                      const isMatch = lookup?.property === property && isAnswer

                      return (
                        <motion.li
                          key={property}
                          animate={
                            isMatch
                              ? { scale: [1, 1.14, 1], color: 'var(--color-accent)' }
                              : { scale: 1, color: 'var(--color-fg)' }
                          }
                          transition={SETTLE}
                          className="rounded bg-bg px-1.5 py-0.5"
                        >
                          {property}
                        </motion.li>
                      )
                    })
                  )}
                </ul>
              </motion.div>
            </li>
          )
        })}
      </ol>

      {lookup ? (
        <motion.p
          key={`${player.index}-lookup`}
          initial={reducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SETTLE}
          className="mt-3 font-mono text-xs text-muted"
        >
          looking up <span className="text-fg">{lookup.property}</span>
          {lookup.foundIn ? (
            <span className="text-accent"> &rarr; found on {lookup.foundIn}</span>
          ) : (
            <span className="text-fail"> &rarr; undefined</span>
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
