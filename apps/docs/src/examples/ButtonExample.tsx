import { Button } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function ButtonExample() {
  return (
    <Preview>
      <Button variant="solid">Solid</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </Preview>
  )
}
