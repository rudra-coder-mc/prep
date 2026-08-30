import { daysBetween, toDayString } from '@prep/core'

/** What the server knows about a device, which is only ever these three things. */
export type DeviceSyncRecord = {
  deviceId: string
  name: string
  lastSyncedAt: Date
}

export type DeviceSyncStatus = DeviceSyncRecord & {
  /** Calendar days in the app's timezone since the last exchange, never negative. */
  daysSince: number
  /** Reads as "Last synced <label>". */
  label: string
  stale: boolean
}

/**
 * When a device has been quiet long enough to be worth mentioning.
 *
 * A phone syncs on launch and on returning to the foreground, so any day it was
 * opened it was heard from. Three days of silence means it has not been picked
 * up, or that the exchange has been failing, which it does silently by design.
 * Shorter than this and an ordinary weekend away from the phone nags.
 */
export const DEVICE_STALE_DAYS = 3

/**
 * The sync reminder, which is the whole of what the web can say about a device.
 * A sync is always started by the device, because the server has no route to a
 * sleeping phone. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
export function summariseDevices(
  devices: DeviceSyncRecord[],
  now = new Date(),
): DeviceSyncStatus[] {
  const today = toDayString(now)

  return (
    devices
      .map((device) => {
        // A clock that has run backwards, or a device a timezone ahead, would
        // otherwise count days into the future and read as a negative.
        const daysSince = Math.max(0, daysBetween(toDayString(device.lastSyncedAt), today))

        return {
          ...device,
          daysSince,
          label: describeDays(daysSince),
          stale: daysSince >= DEVICE_STALE_DAYS,
        }
      })
      // Longest quiet first, so anything worth acting on leads. Name breaks a
      // tie, because the rows come back in no particular order and two devices
      // synced the same day would otherwise swap places between renders.
      .sort((a, b) => b.daysSince - a.daysSince || a.name.localeCompare(b.name))
  )
}

function describeDays(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
