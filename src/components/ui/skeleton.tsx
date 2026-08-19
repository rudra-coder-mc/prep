import { cx } from '@/lib/cx'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('shimmer rounded-md', className)} />
}

/** The frame every loading state shares: a title block over a body block. */
export function SkeletonPage({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  )
}
