import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { deviceSync } from '@/db/schema'
import { summariseDevices, type DeviceSyncStatus } from './device-status'

/**
 * Every device that has ever synced, and how long ago each was heard from.
 *
 * The rows are only ever written by a device's own exchange, so this is the
 * whole of what the server can say about one.
 */
export async function getDevices(userId: string, now = new Date()): Promise<DeviceSyncStatus[]> {
  const rows = await db
    .select({
      deviceId: deviceSync.deviceId,
      name: deviceSync.name,
      lastSyncedAt: deviceSync.lastSyncedAt,
    })
    .from(deviceSync)
    .where(eq(deviceSync.userId, userId))

  return summariseDevices(rows, now)
}
