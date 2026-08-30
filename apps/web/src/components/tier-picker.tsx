'use client'

import { useTransition } from 'react'
import { pickTierAction } from '@/actions/tracks'
import { TIER_LABELS, TIERS, type Tier } from '@prep/core'
import { cx } from '@/lib/cx'

/**
 * Picks the level of interview a track is being prepared for. The pick decides
 * which topics are on the path and which of their questions marking a topic
 * learned enrols, so it sits with the track it applies to rather than in a
 * settings page nobody opens.
 */
export function TierPicker({
  technology,
  label,
  tier,
}: {
  technology: string
  label: string
  tier: Tier
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div
      role="group"
      aria-label={`Preparing for ${label}`}
      className={cx(
        'flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 transition-opacity',
        pending && 'opacity-60',
      )}
    >
      {TIERS.map((option) => {
        const active = option === tier

        return (
          <button
            key={option}
            type="button"
            disabled={pending}
            aria-pressed={active}
            onClick={() => startTransition(() => pickTierAction(technology, option))}
            className={cx(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:pointer-events-none',
              active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg',
            )}
          >
            {TIER_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}
