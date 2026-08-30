import { RouteProgress } from '@/components/chrome/route-progress'
import { TopBar } from '@/components/chrome/top-bar'
import { requireSession } from '@/lib/session'
import { getShellSummary } from '@/lib/shell'

/**
 * The signed-in shell. It renders once and survives every navigation inside the
 * group, so the bar, the streak and the due count stay put while pages change.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  const summary = await getShellSummary(session.user.id)

  return (
    <div className="flex min-h-screen flex-col">
      <RouteProgress />
      <TopBar
        email={session.user.email}
        dueToday={summary.dueToday}
        streak={summary.streak.current}
      />
      {children}
    </div>
  )
}
