import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { trackTier } from '@/db/schema'
import type { Tier } from '@/content/schema'
import { DEFAULT_TIER } from './tiers'

/**
 * Which tier a user is preparing for on each track. Storage only: what a tier
 * covers is in ./tiers, and enrolling the questions it covers is in ./progress.
 *
 * A track with no row is on the default tier, so nothing has to be written when
 * a user signs up or when a new track appears under `content/`.
 */
export async function getTrackTiers(userId: string): Promise<Map<string, Tier>> {
  const rows = await db
    .select({ technology: trackTier.technology, tier: trackTier.tier })
    .from(trackTier)
    .where(eq(trackTier.userId, userId))

  return new Map(rows.map((row) => [row.technology, row.tier]))
}

export async function getTrackTier(userId: string, technology: string): Promise<Tier> {
  const [row] = await db
    .select({ tier: trackTier.tier })
    .from(trackTier)
    .where(and(eq(trackTier.userId, userId), eq(trackTier.technology, technology)))
    .limit(1)

  return row?.tier ?? DEFAULT_TIER
}

export async function setTrackTier(userId: string, technology: string, tier: Tier) {
  await db
    .insert(trackTier)
    .values({ userId, technology, tier, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [trackTier.userId, trackTier.technology],
      set: { tier, updatedAt: new Date() },
    })
}
