'use client'

import { VisualFrame } from './step-controls'
import { useStepPlayer } from './use-step-player'

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
  const step = steps[player.index]
  const lookup = step?.lookup

  return (
    <VisualFrame title={title} player={player}>
      <div className="space-y-2">
        {(step?.scopes ?? []).map((scope, depth) => {
          const isAnswer = lookup?.foundIn === scope.name
          // Scopes nearer the lookup are searched first, so shade by depth.
          const isSearched =
            lookup !== undefined &&
            (lookup.foundIn === undefined ||
              depth >= (step?.scopes ?? []).findIndex((s) => s.name === lookup.foundIn))

          return (
            <div
              key={scope.name}
              data-scope={scope.name}
              data-answer={isAnswer || undefined}
              style={{ marginLeft: `${depth * 12}px` }}
              className={`rounded-lg border p-2 ${
                isAnswer
                  ? 'border-[var(--color-accent)]'
                  : isSearched
                    ? 'border-[var(--color-border)]'
                    : 'border-[var(--color-border)] opacity-60'
              }`}
            >
              <h4 className="font-mono text-xs text-[var(--color-muted)]">{scope.name}</h4>
              <ul className="mt-1 flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(scope.bindings).length === 0 ? (
                  <li className="text-[var(--color-muted)]">no bindings</li>
                ) : (
                  Object.entries(scope.bindings).map(([name, value]) => (
                    <li
                      key={name}
                      data-binding={name}
                      className={
                        lookup?.name === name && isAnswer ? 'text-[var(--color-accent)]' : ''
                      }
                    >
                      {name} = {value}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {lookup ? (
        <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">
          resolving <span className="text-[var(--color-fg)]">{lookup.name}</span>
          {lookup.foundIn ? ` -> found in ${lookup.foundIn}` : ' -> not found'}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-relaxed">{step?.note}</p>
    </VisualFrame>
  )
}
