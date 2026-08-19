import { cx } from '@/lib/cx'

/**
 * Width is a CSS transition rather than a JS animation, so a bar rendered on
 * the server still grows into place on navigation without shipping any code.
 */
export function ProgressBar({
  value,
  tone = 'accent',
  className,
  label,
}: {
  value: number
  tone?: 'accent' | 'pass' | 'weak'
  className?: string
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  const fill = { accent: 'bg-accent', pass: 'bg-pass', weak: 'bg-weak' }[tone]

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cx('h-1.5 w-full overflow-hidden rounded-full bg-raised', className)}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-700 ease-out', fill)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
