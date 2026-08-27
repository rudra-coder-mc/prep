'use server'

import { revalidatePath } from 'next/cache'
import type { Tier } from '@/content/schema'
import { pickTrackTier } from '@/lib/progress'
import { requireSession } from '@/lib/session'

export async function pickTierAction(technology: string, tier: Tier) {
  const session = await requireSession()
  await pickTrackTier(session.user.id, technology, tier)

  // The pick decides which topics are on the path and how much of each one is
  // in scope, so both places that count topics have to be re-read.
  revalidatePath('/topics')
  revalidatePath('/')
}
