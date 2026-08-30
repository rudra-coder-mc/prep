import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DeviceSyncList } from './device-sync-list'
import type { DeviceSyncStatus } from '@/lib/device-status'

/**
 * The reminder is the only thing device_sync exists for, so what matters here
 * is that it appears for a device that has gone quiet and nowhere else. The
 * rule deciding which is which is pinned in device-status.test.ts.
 */
const device = (overrides: Partial<DeviceSyncStatus> = {}): DeviceSyncStatus => ({
  deviceId: 'device-phone',
  name: 'Pixel',
  lastSyncedAt: new Date('2026-08-30T09:00:00.000Z'),
  daysSince: 0,
  label: 'today',
  stale: false,
  ...overrides,
})

const quiet = (overrides: Partial<DeviceSyncStatus> = {}) =>
  device({ label: '9 days ago', daysSince: 9, stale: true, ...overrides })

const REMINDER = /Open the app on it/

describe('DeviceSyncList', () => {
  it('says when a device last synced', () => {
    render(<DeviceSyncList devices={[device({ label: 'yesterday', daysSince: 1 })]} />)

    expect(screen.getByText('Pixel')).toBeDefined()
    expect(screen.getByText('Last synced yesterday')).toBeDefined()
  })

  it('says nothing further about a device that has synced recently', () => {
    render(<DeviceSyncList devices={[device()]} />)

    expect(screen.queryByText(REMINDER)).toBeNull()
  })

  it('reminds about a device that has not been heard from in a while', () => {
    render(<DeviceSyncList devices={[quiet()]} />)

    expect(screen.getByText('Last synced 9 days ago')).toBeDefined()
    expect(screen.getByText(REMINDER)).toBeDefined()
  })

  it('reminds about the quiet device only, when one is fresh and one is not', () => {
    const { container } = render(
      <DeviceSyncList
        devices={[
          quiet({ deviceId: 'quiet', name: 'Old phone' }),
          device({ deviceId: 'busy', name: 'New phone' }),
        ]}
      />,
    )

    expect(screen.getAllByText(REMINDER)).toHaveLength(1)
    expect(container.querySelector('[data-device="quiet"]')?.getAttribute('data-stale')).toBe(
      'true',
    )
    expect(container.querySelector('[data-device="busy"]')?.getAttribute('data-stale')).toBe(
      'false',
    )
  })

  it('renders nothing at all when no device has ever synced', () => {
    const { container } = render(<DeviceSyncList devices={[]} />)
    expect(container.innerHTML).toBe('')
  })
})
