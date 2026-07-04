import { useState } from 'react'
import { Switch } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function SwitchExample() {
  const [enabled, setEnabled] = useState(true)

  return (
    <Preview>
      <div className="flex flex-col gap-3">
        <Switch label="Enable notifications" checked={enabled} onCheckedChange={setEnabled} />
        <Switch label="Disabled option" disabled />
      </div>
    </Preview>
  )
}
