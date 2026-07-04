import { useState } from 'react'
import { Pagination } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function PaginationExample() {
  const [page, setPage] = useState(5)

  return (
    <Preview>
      <div className="flex flex-col items-center gap-2">
        <Pagination page={page} pageCount={10} onPageChange={setPage} />
        <p className="text-muted-foreground text-sm">Page {page} of 10</p>
      </div>
    </Preview>
  )
}
