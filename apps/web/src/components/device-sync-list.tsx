import { SectionLabel } from '@/components/ui/card'
import { cx } from '@/lib/cx'
import type { DeviceSyncStatus } from '@/lib/device-status'

/**
 * When each device last synced, and a reminder for any that has gone quiet.
 *
 * A sync is always started by the device, so this is the only thing the web can
 * do about one that has stopped: say so. See
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
export function DeviceSyncList({ devices }: { devices: DeviceSyncStatus[] }) {
  if (devices.length === 0) return null

  return (
    <section className="mt-10">
      <SectionLabel>Devices</SectionLabel>
      <ul className="mt-3 space-y-2">
        {devices.map((device) => (
          <li
            key={device.deviceId}
            data-device={device.deviceId}
            data-stale={device.stale}
            className={cx(
              'rounded-card border px-4 py-3',
              device.stale ? 'border-weak/40 bg-weak/5' : 'border-border bg-surface',
            )}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-medium">{device.name}</span>
              <span className={cx('text-xs', device.stale ? 'text-weak' : 'text-faint')}>
                Last synced {device.label}
              </span>
            </div>
            {device.stale ? (
              <p className="mt-1.5 text-xs text-muted">
                Open the app on it to send what it has answered. A sync only ever starts from the
                device.
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
