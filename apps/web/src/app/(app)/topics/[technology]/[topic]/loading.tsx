import { PageShell } from '@/components/ui/page'
import { Skeleton } from '@/components/ui/skeleton'

export default function TopicLoading() {
  return (
    <PageShell width="reading">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-9 w-72" />
      <Skeleton className="mt-3 h-5 w-full max-w-lg" />
      <div className="mt-10 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="mt-8 h-56 w-full" />
      </div>
    </PageShell>
  )
}
