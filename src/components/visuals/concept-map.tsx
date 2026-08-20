'use client'

import { AnimatePresence, motion } from 'motion/react'
import { cx } from '@/lib/cx'
import { LinkLayer, QUICK, SETTLE, StepNote, useMeasuredLinks } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type ConceptBranch = {
  label: string
  /** The one sentence to carry away from this branch. */
  summary: string
  /** The details under it, revealed together when the branch is reached. */
  nodes: string[]
}

export type ConceptMapProps = {
  title?: string
  /** The idea everything hangs off. */
  center: string
  branches: ConceptBranch[]
}

/**
 * The recap at the end of a lesson: the shape of a topic as one picture. The
 * skeleton is drawn from the start, because the arrangement is the part worth
 * remembering, and each branch fills in as it is reached.
 */
export function ConceptMap({ title = 'The whole topic', center, branches }: ConceptMapProps) {
  const player = useStepPlayer(branches.length, 2600)
  const reducedMotion = usePrefersReducedMotion()
  const current = branches[player.index]

  const links = branches.map((branch, i) => ({
    id: branch.label,
    from: 'center',
    to: `branch:${branch.label}`,
    accent: i <= player.index,
  }))

  // Stacked, the branches sit under the centre rather than beside it, so the
  // links run down the margin instead of cutting across the boxes between.
  const { containerRef, register, drawn } = useMeasuredLinks(links, player.index, 'gutter')

  return (
    <VisualFrame title={title} player={player}>
      <div
        ref={containerRef}
        className="relative grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]"
      >
        <LinkLayer links={drawn} reducedMotion={reducedMotion} />

        <motion.div
          ref={register('center')}
          data-center={center}
          animate={{
            boxShadow: player.isPlaying
              ? [
                  '0 0 0 1px var(--color-accent)',
                  '0 0 24px -6px var(--color-accent)',
                  '0 0 0 1px var(--color-accent)',
                ]
              : '0 0 0 1px var(--color-accent)',
          }}
          transition={player.isPlaying ? { duration: 2.4, repeat: Infinity } : QUICK}
          className="justify-self-start rounded-xl border border-accent bg-accent-dim px-4 py-3 text-center text-sm font-medium text-fg sm:justify-self-center"
        >
          {center}
        </motion.div>

        <ul className="space-y-2 pl-5 sm:pl-0">
          {branches.map((branch, i) => {
            const reached = i <= player.index
            const isCurrent = i === player.index

            return (
              <motion.li
                key={branch.label}
                ref={register(`branch:${branch.label}`)}
                data-branch={branch.label}
                data-reached={reached || undefined}
                animate={{
                  opacity: reached ? 1 : 0.4,
                  borderColor: isCurrent ? 'var(--color-accent)' : 'var(--color-border)',
                }}
                transition={SETTLE}
                className={cx('rounded-lg border bg-bg/60 px-2.5 py-2')}
              >
                <h4 className="text-xs font-medium tracking-wide text-fg uppercase">
                  {branch.label}
                </h4>

                <AnimatePresence initial={false}>
                  {reached ? (
                    <motion.ul
                      initial={reducedMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={SETTLE}
                      className="mt-1.5 flex flex-wrap gap-1.5 overflow-hidden"
                    >
                      {branch.nodes.map((node, index) => (
                        <motion.li
                          key={node}
                          data-node={node}
                          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            ...SETTLE,
                            delay: reducedMotion || !isCurrent ? 0 : index * 0.12,
                          }}
                          className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.7rem] text-muted"
                        >
                          {node}
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : null}
                </AnimatePresence>
              </motion.li>
            )
          })}
        </ul>
      </div>

      <StepNote
        note={current?.summary ?? ''}
        stepKey={player.index}
        direction={player.direction}
        reducedMotion={reducedMotion}
      />
    </VisualFrame>
  )
}
