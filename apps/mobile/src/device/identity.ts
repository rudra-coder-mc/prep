import { readSetting, writeSetting } from '../db/settings'
import type { Database } from '../db/sqlite'

/**
 * The id and name a sync sends, which is what the web's device list is built
 * from. See docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 *
 * The id is made once and kept for as long as the app is installed, because the
 * server keys a device row on it: a new id is a new phone as far as the
 * dashboard is concerned. The name is only a label, so it follows whatever the
 * system currently calls the device.
 */

export type DeviceIdentity = { id: string; name: string }

/** Used when the system will not say, which on Android it often will not. */
const FALLBACK_NAME = 'Phone'

export async function deviceIdentity(
  db: Database,
  { newId, suggestedName }: { newId: () => string; suggestedName: string | null },
): Promise<DeviceIdentity> {
  let id = await readSetting(db, 'device-id')
  if (!id) {
    id = newId()
    await writeSetting(db, 'device-id', id)
  }

  const stored = await readSetting(db, 'device-name')
  const name = suggestedName?.trim() || stored || FALLBACK_NAME
  if (name !== stored) await writeSetting(db, 'device-name', name)

  return { id, name }
}
