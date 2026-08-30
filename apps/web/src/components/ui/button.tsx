import { cx } from '@/lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition duration-150 ease-out select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 shadow-sm shadow-accent-dim',
  secondary: 'border border-border bg-surface text-fg hover:border-edge hover:bg-raised',
  ghost: 'text-muted hover:bg-surface hover:text-fg',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

/**
 * Buttons and links have to look identical when they do the same job, so the
 * styling is a function rather than a component.
 */
export function buttonClass({
  variant = 'secondary',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}): string {
  return cx(BASE, VARIANTS[variant], SIZES[size], className)
}

export function Button({
  variant,
  size,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return <button className={buttonClass({ variant, size, className })} {...props} />
}
