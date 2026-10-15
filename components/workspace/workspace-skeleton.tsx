import { Skeleton } from "@/components/ui/skeleton"

export function WorkspaceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Skeleton className="h-96 rounded-xl" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-9 rounded-lg" />
      </div>
    </div>
  )
}
