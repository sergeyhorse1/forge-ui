import { useState } from 'react'
import { FilterBuilder } from '@sergeyhorse/forge'
import type { FilterFieldSchema, FilterTree } from '@sergeyhorse/forge'

import { Preview } from './Preview'

const fields: FilterFieldSchema = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'price', label: 'Price', type: 'number' },
  {
    field: 'plan',
    label: 'Plan',
    type: 'enum',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Team', value: 'team' },
    ],
  },
]

const initialTree: FilterTree = {
  combinator: 'and',
  rules: [
    { field: 'name', operator: 'contains', value: 'acme' },
    { field: 'plan', operator: 'in', value: ['pro', 'team'] },
  ],
}

export function FilterBuilderExample() {
  const [value, setValue] = useState<FilterTree>(initialTree)

  return (
    <Preview>
      <div className="w-full max-w-2xl">
        <FilterBuilder value={value} onChange={setValue} fields={fields} />
      </div>
    </Preview>
  )
}
