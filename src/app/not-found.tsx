import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-medium tracking-wider text-faint uppercase">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page does not exist</h1>
        <p className="mt-2 text-sm text-muted">
          The topic may have been renamed, or the address mistyped.
        </p>
        <Link href="/" className={buttonClass({ variant: 'secondary', className: 'mt-6' })}>
          Back to the dashboard
        </Link>
      </div>
    </main>
  )
}
