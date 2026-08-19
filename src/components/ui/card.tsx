import { cx } from '@/lib/cx'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { className?: string }) {
  return (
    <div className={cx('rounded-card border border-border bg-surface p-5', className)} {...props} />
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium tracking-wider text-faint uppercase">{children}</h2>
}
