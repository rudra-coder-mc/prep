import { PageShell } from '@/components/ui/page'
import { SkeletonPage } from '@/components/ui/skeleton'

export default function TopicsLoading() {
  return (
    <PageShell width="reading">
      <SkeletonPage lines={5} />
    </PageShell>
  )
}
