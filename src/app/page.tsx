import Link from 'next/link'
import { getStreaks } from '@/lib/activity'
import { requireSession } from '@/lib/session'
import { SignOutButton } from '@/components/sign-out-button'

export default async function Home() {
  const session = await requireSession()
  const streaks = await getStreaks(session.user.id)

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">prep</h1>
      <p className="mt-3 text-[var(--color-muted)]">Signed in as {session.user.email}.</p>

      <p className="mt-6 text-sm" data-streak={streaks.current}>
        <span className="text-2xl font-semibold tabular-nums">{streaks.current}</span>{' '}
        <span className="text-[var(--color-muted)]">
          day streak{streaks.longest > streaks.current ? ` · best ${streaks.longest}` : ''}
        </span>
      </p>
      <nav className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/review"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 font-medium text-[var(--color-bg)]"
        >
          Review weak topics
        </Link>
        <Link href="/topics" className="rounded-md border border-[var(--color-border)] px-4 py-2">
          Continue learning
        </Link>
      </nav>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  )
}
