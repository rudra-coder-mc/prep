import { STATUS_LABELS, type TopicStatus } from '@prep/core'
import { cx } from '@/lib/cx'

const TONES: Record<TopicStatus, string> = {
  not_started: 'border-border text-faint',
  learning: 'border-accent/40 bg-accent-dim text-accent',
  weak: 'border-weak/40 bg-weak/10 text-weak',
  understood: 'border-pass/40 bg-pass/10 text-pass',
  mastered: 'border-pass bg-pass/15 text-pass',
}

const DOTS: Record<TopicStatus, string> = {
  not_started: 'bg-faint',
  learning: 'bg-accent',
  weak: 'bg-weak',
  understood: 'bg-pass',
  mastered: 'bg-pass',
}

export function StatusBadge({ status, className }: { status: TopicStatus; className?: string }) {
  return (
    <span
      data-status={status}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        TONES[status],
        className,
      )}
    >
      <span className={cx('size-1.5 rounded-full', DOTS[status])} />
      {STATUS_LABELS[status]}
    </span>
  )
}
