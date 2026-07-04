import { Checkbox } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function CheckboxExample() {
  return (
    <Preview>
      <div className="flex flex-col gap-3">
        <Checkbox label="Email notifications" defaultChecked />
        <Checkbox label="SMS notifications" />
        <Checkbox label="Locked preference" disabled />
      </div>
    </Preview>
  )
}
