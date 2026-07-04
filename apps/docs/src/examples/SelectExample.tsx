import { useState } from 'react'
import { Select } from '@sergeyhorse/forge'

import { Preview } from './Preview'

const fruits = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
]

export function SelectExample() {
  const [value, setValue] = useState('')

  return (
    <Preview>
      <div className="w-full max-w-xs">
        <Select
          items={fruits}
          value={value}
          onValueChange={setValue}
          placeholder="Select a fruit…"
          aria-label="Fruit"
        />
      </div>
    </Preview>
  )
}
