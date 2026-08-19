import { PageShell } from '@/components/ui/page'
import { SkeletonPage } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <PageShell>
      <SkeletonPage lines={3} />
    </PageShell>
  )
}
