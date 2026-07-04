import { Badge } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function BadgeExample() {
  return (
    <Preview>
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </Preview>
  )
}
