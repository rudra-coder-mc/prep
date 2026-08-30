import { cx } from '@/lib/cx'

const WIDTHS = {
  wide: 'max-w-5xl',
  reading: 'max-w-3xl',
  narrow: 'max-w-2xl',
} as const

/** Every page sits in the same gutter, so the shell never appears to shift. */
export function PageShell({
  width = 'wide',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <main className={cx('mx-auto w-full px-4 pt-8 pb-24 sm:px-6', WIDTHS[width], className)}>
      {children}
    </main>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium tracking-wider text-faint uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
