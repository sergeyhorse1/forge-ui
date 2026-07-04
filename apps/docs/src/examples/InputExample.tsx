import { useState } from 'react'
import { Input } from '@sergeyhorse/forge'

import { Preview } from './Preview'

export function InputExample() {
  const [value, setValue] = useState('')

  return (
    <Preview>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Input
          placeholder="you@example.com"
          value={value}
          onValueChange={setValue}
          aria-label="Email"
        />
        <Input placeholder="Invalid input" error="This field is required" aria-label="With error" />
        <Input placeholder="Disabled" disabled aria-label="Disabled" />
      </div>
    </Preview>
  )
}
