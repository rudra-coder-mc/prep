import { describe, expect, it } from 'vitest'
import { DEVICE_STALE_DAYS, summariseDevices, type DeviceSyncRecord } from './device-status'

const NOW = new Date('2026-08-30T09:00:00.000Z')

const device = (overrides: Partial<DeviceSyncRecord> = {}): DeviceSyncRecord => ({
  deviceId: 'device-phone',
  name: 'Pixel',
  lastSyncedAt: NOW,
  ...overrides,
})

const daysBefore = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)

describe('summariseDevices', () => {
  it('says today for a device that has just synced', () => {
    const [summary] = summariseDevices([device()], NOW)
    expect(summary?.daysSince).toBe(0)
    expect(summary?.label).toBe('today')
    expect(summary?.stale).toBe(false)
  })

  it('says yesterday rather than a count of one', () => {
    const [summary] = summariseDevices([device({ lastSyncedAt: daysBefore(1) })], NOW)
    expect(summary?.label).toBe('yesterday')
  })

  it('counts days after that', () => {
    const [summary] = summariseDevices([device({ lastSyncedAt: daysBefore(2) })], NOW)
    expect(summary?.label).toBe('2 days ago')
  })

  /**
   * Calendar days, not elapsed hours: a sync at eleven last night was
   * yesterday, however few hours ago it was.
   */
  it('measures calendar days rather than twenty-four hour blocks', () => {
    const lateLastNight = new Date('2026-08-29T23:00:00.000Z')
    const [summary] = summariseDevices([device({ lastSyncedAt: lateLastNight })], NOW)
    expect(summary?.daysSince).toBe(1)
    expect(summary?.label).toBe('yesterday')
  })

  it('is not stale on the day before the threshold', () => {
    const summaries = summariseDevices(
      [device({ lastSyncedAt: daysBefore(DEVICE_STALE_DAYS - 1) })],
      NOW,
    )
    expect(summaries[0]?.stale).toBe(false)
  })

  it('is stale on the threshold and past it', () => {
    for (const days of [DEVICE_STALE_DAYS, DEVICE_STALE_DAYS + 10]) {
      const [summary] = summariseDevices([device({ lastSyncedAt: daysBefore(days) })], NOW)
      expect(summary?.stale).toBe(true)
    }
  })

  /**
   * A clock that has run backwards, or a device that synced moments ago in a
   * timezone ahead of the app's. Neither is stale and neither should read as a
   * negative count of days.
   */
  it('treats a sync dated in the future as today', () => {
    const [summary] = summariseDevices([device({ lastSyncedAt: daysBefore(-2) })], NOW)
    expect(summary?.daysSince).toBe(0)
    expect(summary?.label).toBe('today')
    expect(summary?.stale).toBe(false)
  })

  it('breaks a tie by name, so two devices synced today keep one order', () => {
    const summaries = summariseDevices(
      [device({ deviceId: 'b', name: 'Tablet' }), device({ deviceId: 'a', name: 'Pixel' })],
      NOW,
    )
    expect(summaries.map((summary) => summary.name)).toEqual(['Pixel', 'Tablet'])
  })

  it('puts the device heard from longest ago first, so a stale one leads', () => {
    const summaries = summariseDevices(
      [
        device({ deviceId: 'a', name: 'Fresh', lastSyncedAt: NOW }),
        device({ deviceId: 'b', name: 'Stale', lastSyncedAt: daysBefore(9) }),
        device({ deviceId: 'c', name: 'Middling', lastSyncedAt: daysBefore(2) }),
      ],
      NOW,
    )
    expect(summaries.map((summary) => summary.name)).toEqual(['Stale', 'Middling', 'Fresh'])
  })

  it('summarises nothing when no device has ever synced', () => {
    expect(summariseDevices([], NOW)).toEqual([])
  })
})
