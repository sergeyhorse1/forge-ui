import { Button, Tooltip } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function TooltipExample() {
  return (
    <Preview>
      <Tooltip content="Added to your library">
        <Button variant="outline">Hover me</Button>
      </Tooltip>
    </Preview>
  )
}
