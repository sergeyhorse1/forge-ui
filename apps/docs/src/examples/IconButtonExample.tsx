import { IconButton } from '@sergeyhorse/forge'

import { Preview } from './Preview'

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function IconButtonExample() {
  return (
    <Preview>
      <IconButton variant="solid" aria-label="Add item" icon={<PlusIcon />} />
      <IconButton variant="soft" aria-label="Add item" icon={<PlusIcon />} />
      <IconButton variant="outline" aria-label="Add item" icon={<PlusIcon />} />
      <IconButton variant="ghost" aria-label="Add item" icon={<PlusIcon />} />
      <IconButton aria-label="Loading" icon={<PlusIcon />} loading />
    </Preview>
  )
}
