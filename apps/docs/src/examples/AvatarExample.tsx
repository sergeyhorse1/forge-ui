import { Avatar } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function AvatarExample() {
  return (
    <Preview>
      <Avatar size="sm" fallback="AM" alt="Ada Moore" />
      <Avatar size="md" src="https://i.pravatar.cc/80?u=forge" fallback="JD" alt="Jane Doe" />
      <Avatar size="lg" fallback="RK" alt="Rae King" />
    </Preview>
  )
}
