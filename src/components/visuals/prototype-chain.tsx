'use client'

import { VisualFrame } from './step-controls'
import { useStepPlayer } from './use-step-player'

export type PrototypeStep = {
  note: string
  /** The object being used first, then each prototype in turn. */
  chain: { id: string; label: string; properties: string[] }[]
  /** A property being looked up, and where it was found. */
  lookup?: { property: string; foundIn?: string }
}

export function PrototypeChain({
  title = 'Prototype chain',
  steps,
}: {
  title?: string
  steps: PrototypeStep[]
}) {
  const player = useStepPlayer(steps.length)
  const step = steps[player.index]
  const lookup = step?.lookup
  const foundAt = lookup?.foundIn
    ? (step?.chain ?? []).findIndex((link) => link.id === lookup.foundIn)
    : -1

  return (
    <VisualFrame title={title} player={player}>
      <ol className="space-y-1">
        {(step?.chain ?? []).map((link, depth) => {
          const isAnswer = depth === foundAt
          // Everything before the answer was searched and missed.
          const wasSearched = lookup !== undefined && (foundAt === -1 || depth <= foundAt)

          return (
            <li key={link.id} data-link={link.id} data-answer={isAnswer || undefined}>
              {depth > 0 ? (
                <p className="pl-3 font-mono text-xs text-[var(--color-muted)]">&darr; __proto__</p>
              ) : null}
              <div
                className={`rounded-lg border p-2 ${
                  isAnswer
                    ? 'border-[var(--color-accent)]'
                    : wasSearched
                      ? 'border-[var(--color-border)]'
                      : 'border-[var(--color-border)] opacity-60'
                }`}
              >
                <h4 className="font-mono text-xs text-[var(--color-muted)]">{link.label}</h4>
                <ul className="mt-1 flex flex-wrap gap-2 font-mono text-xs">
                  {link.properties.length === 0 ? (
                    <li className="text-[var(--color-muted)]">no own properties</li>
                  ) : (
                    link.properties.map((property) => (
                      <li
                        key={property}
                        className={
                          lookup?.property === property && isAnswer
                            ? 'text-[var(--color-accent)]'
                            : ''
                        }
                      >
                        {property}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </li>
          )
        })}
      </ol>

      {lookup ? (
        <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
          looking up <span className="text-[var(--color-fg)]">{lookup.property}</span>
          {lookup.foundIn ? ` -> found on ${lookup.foundIn}` : ' -> undefined'}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed">{step?.note}</p>
    </VisualFrame>
  )
}
