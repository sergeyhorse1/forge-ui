import { Avatar } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function AvatarExample() {
  return (
    <Preview>
      <Avatar size="sm" fallback="AM" alt="Ada Moore" />
      <Avatar
        size="md"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%236366f1'/%3E%3Ctext x='50%25' y='50%25' dy='.35em' text-anchor='middle' font-family='sans-serif' font-size='32' fill='white'%3EJD%3C/text%3E%3C/svg%3E"
        fallback="JD"
        alt="Jane Doe"
      />
      <Avatar size="lg" fallback="RK" alt="Rae King" />
    </Preview>
  )
}
