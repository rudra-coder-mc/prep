import { randomUUID } from 'expo-crypto'
import { deviceName } from 'expo-device'
import { deviceIdentity, type DeviceIdentity } from './identity'
import type { Database } from '../db/sqlite'

/**
 * The device's own identity, read from the phone rather than from a test.
 *
 * `deviceName` is what the person called the phone in its settings, and Android
 * returns null for it often enough that ./identity.ts has to have an answer for
 * that rather than treating it as impossible.
 */
export function readDeviceIdentity(db: Database): Promise<DeviceIdentity> {
  return deviceIdentity(db, { newId: randomUUID, suggestedName: deviceName })
}
