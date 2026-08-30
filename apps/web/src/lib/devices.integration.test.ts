import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { deviceSync } from '@/db/schema'
import {
  createTestDatabase,
  insertTestUser,
  useTestDatabase,
  type TestDatabase,
} from '@/db/testing'
import { getDevices } from '@/lib/devices'

let ctx: TestDatabase
let restore: () => Promise<void>
let userId: string
let otherUserId: string

const NOW = new Date('2026-08-30T09:00:00.000Z')

const daysBefore = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)
  userId = await insertTestUser(ctx.db, 'owner@local')
  otherUserId = await insertTestUser(ctx.db, 'other@local')
}, 60_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(deviceSync)
})

async function record(device: { id: string; name: string; lastSyncedAt: Date }, owner = userId) {
  await ctx.db.insert(deviceSync).values({
    userId: owner,
    deviceId: device.id,
    name: device.name,
    lastSyncedAt: device.lastSyncedAt,
  })
}

describe('getDevices', () => {
  it('says when each device was last heard from', async () => {
    await record({ id: 'phone', name: 'Pixel', lastSyncedAt: daysBefore(1) })

    const devices = await getDevices(userId, NOW)

    expect(devices).toHaveLength(1)
    expect(devices[0]?.name).toBe('Pixel')
    expect(devices[0]?.label).toBe('yesterday')
    expect(devices[0]?.stale).toBe(false)
  })

  it('flags one that has not synced in a while and leaves a fresh one alone', async () => {
    await record({ id: 'phone', name: 'Pixel', lastSyncedAt: daysBefore(9) })
    await record({ id: 'tablet', name: 'Tablet', lastSyncedAt: NOW })

    const devices = await getDevices(userId, NOW)

    expect(devices.map((device) => [device.name, device.stale])).toEqual([
      ['Pixel', true],
      ['Tablet', false],
    ])
  })

  it('returns nothing when no device has ever synced', async () => {
    expect(await getDevices(userId, NOW)).toEqual([])
  })

  it('never reports a device belonging to another account', async () => {
    await record({ id: 'phone', name: 'Theirs', lastSyncedAt: daysBefore(9) }, otherUserId)

    expect(await getDevices(userId, NOW)).toEqual([])
  })
})
