'use client'

import { OutputLog, Region, StepNote, Token, useVisualNamespace } from './flow'
import { VisualFrame } from './step-controls'
import { usePrefersReducedMotion, useStepPlayer } from './use-step-player'

export type CallStackStep = {
  /** Frames from the bottom of the stack upward. */
  frames: string[]
  note: string
  output?: string[]
}

/** Frames repeat in recursion, so identity is the name plus how deep it sits. */
function frameKey(frame: string, depth: number): string {
  return `${frame}@${depth}`
}

export function CallStack({
  title = 'Call stack',
  steps,
}: {
  title?: string
  steps: CallStackStep[]
}) {
  const player = useStepPlayer(steps.length)
  const reducedMotion = usePrefersReducedMotion()
  const namespace = useVisualNamespace()
  const step = steps[player.index]
  const frames = step?.frames ?? []

  return (
    <VisualFrame title={title} player={player}>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Region
          label="Stack"
          direction="up"
          active={frames.length > 0}
          empty={frames.length === 0 ? 'empty' : undefined}
          attributes={{ 'data-depth': String(frames.length) }}
          className="min-h-44"
        >
          {frames.map((frame, depth) => (
            <Token
              key={frameKey(frame, depth)}
              layoutId={`${namespace}-${frameKey(frame, depth)}`}
              label={frame}
              detail={depth === frames.length - 1 ? 'running' : undefined}
              // A pushed frame arrives from below and a popped one leaves the
              // same way, so the stack visibly grows and shrinks downward.
              enterFrom="below"
              tone={depth === frames.length - 1 ? 'accent' : 'dim'}
              emphasis={depth === frames.length - 1}
              reducedMotion={reducedMotion}
              attributes={{ 'data-frame': frame }}
            />
          ))}
        </Region>

        <div className="space-y-3 text-sm">
          <StepNote
            note={step?.note ?? ''}
            stepKey={player.index}
            direction={player.direction}
            reducedMotion={reducedMotion}
          />
          <OutputLog lines={step?.output ?? []} reducedMotion={reducedMotion} />
        </div>
      </div>
    </VisualFrame>
  )
}
