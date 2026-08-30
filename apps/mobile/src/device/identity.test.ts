import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { readSetting, writeSetting } from '../db/settings'
import { createTestDatabase } from '../../test-support/database'
import { deviceIdentity } from './identity'

let db: ReturnType<typeof createTestDatabase>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
})

afterEach(() => db?.close())

const ids = () => {
  let n = 0
  return () => `id-${++n}`
}

describe('who this device says it is', () => {
  it('makes an identity on first run', async () => {
    const identity = await deviceIdentity(db, { newId: ids(), suggestedName: 'Pixel 7' })

    expect(identity).toEqual({ id: 'id-1', name: 'Pixel 7' })
  })

  /**
   * The id is what the server keys a device row on, so a second one would show
   * up on the dashboard as a second phone that never syncs.
   */
  it('keeps the same id for as long as it is installed', async () => {
    const newId = ids()
    const first = await deviceIdentity(db, { newId, suggestedName: 'Pixel 7' })
    const again = await deviceIdentity(db, { newId, suggestedName: 'Pixel 7' })

    expect(again.id).toBe(first.id)
    expect(newId()).toBe('id-2')
  })

  // Android hands the name back as null often enough that it cannot be relied on.
  it('names the device itself when the system will not', async () => {
    const identity = await deviceIdentity(db, { newId: ids(), suggestedName: null })

    expect(identity.name).toBe('Phone')
  })

  // Renaming the phone should reach the dashboard, and the row is keyed by id,
  // so following the system name costs nothing and keeps the two in step.
  it('follows a name the system changed', async () => {
    const newId = ids()
    await deviceIdentity(db, { newId, suggestedName: 'Pixel 7' })

    const renamed = await deviceIdentity(db, { newId, suggestedName: "Atul's Pixel" })

    expect(renamed.name).toBe("Atul's Pixel")
    expect(await readSetting(db, 'device-name')).toBe("Atul's Pixel")
  })

  // Losing the system name later must not rename a device that already has one.
  it('keeps the name it stored when the system stops offering one', async () => {
    const newId = ids()
    await writeSetting(db, 'device-id', 'id-0')
    await writeSetting(db, 'device-name', 'Pixel 7')

    expect(await deviceIdentity(db, { newId, suggestedName: null })).toEqual({
      id: 'id-0',
      name: 'Pixel 7',
    })
  })
})
