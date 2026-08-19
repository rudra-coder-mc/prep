import { requireSession } from '@/lib/session'
import { SignOutButton } from '@/components/sign-out-button'

export default async function Home() {
  const session = await requireSession()

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">prep</h1>
      <p className="mt-3 text-[var(--color-muted)]">Signed in as {session.user.email}.</p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  )
}
