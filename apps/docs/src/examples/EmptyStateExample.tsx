import { Button, EmptyState } from '@sergeyhorse/forge'

import { Preview } from './Preview'

function InboxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l2 3h6l2-3h4M5 6h14l2 6v6H3v-6l2-6z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function EmptyStateExample() {
  return (
    <Preview>
      <div className="w-full max-w-md">
        <EmptyState
          icon={<InboxIcon />}
          title="No messages yet"
          description="When your team starts a conversation it will show up here."
          action={<Button size="sm">Start a thread</Button>}
        />
      </div>
    </Preview>
  )
}
