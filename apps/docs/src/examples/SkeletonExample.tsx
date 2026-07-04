import { Skeleton } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function SkeletonExample() {
  return (
    <Preview>
      <div className="flex w-full max-w-sm items-center gap-4">
        <Skeleton width={48} height={48} className="rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton height={14} width="70%" />
          <Skeleton height={14} width="45%" />
        </div>
      </div>
    </Preview>
  )
}
