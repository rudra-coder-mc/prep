import { PageShell } from '@/components/ui/page'
import { SkeletonPage } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <PageShell width="narrow">
      <SkeletonPage lines={2} />
    </PageShell>
  )
}
