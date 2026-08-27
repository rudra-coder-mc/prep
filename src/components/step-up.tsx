'use client'

import { useTransition } from 'react'
import { pickTierAction } from '@/actions/tracks'
import { TIER_LABELS, type Tier } from '@/content/schema'
import { Button } from '@/components/ui/button'

/**
 * The offer a finished tier makes. It says what accepting it costs, because
 * stepping up enrols the whole of the next tier at once and the queue it lands
 * in is the thing that takes time every morning. Nothing here advances on its
 * own. See docs/decisions/0028-tiers-are-interview-levels.md.
 */
export function StepUp({
  technology,
  label,
  from,
  to,
  adds,
}: {
  technology: string
  label: string
  from: Tier
  to: Tier
  adds: number
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="mt-3 rounded-lg border border-pass/40 bg-pass/10 p-3">
      <p className="text-sm text-pass">
        You are ready for {TIER_LABELS[from]} in {label}.
      </p>
      <p className="mt-1 text-xs text-muted">
        {TIER_LABELS[to]} adds {adds} questions to your recall queue, at the bottom of the ladder.
        Nothing you have already learned moves.
      </p>
      <Button
        size="sm"
        variant="primary"
        disabled={pending}
        className="mt-3"
        onClick={() => startTransition(() => pickTierAction(technology, to))}
      >
        {pending ? 'Stepping up...' : `Step up to ${TIER_LABELS[to]}`}
      </Button>
    </div>
  )
}
