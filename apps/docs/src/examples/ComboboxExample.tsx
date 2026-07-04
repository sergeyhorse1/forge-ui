import { useState } from 'react'
import { Combobox } from '@sergeyhorse/forge'

import { Preview } from './Preview'

const frameworks = [
  { value: 'astro', label: 'Astro' },
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'solid', label: 'SolidStart' },
]

export function ComboboxExample() {
  const [value, setValue] = useState('')

  return (
    <Preview>
      <div className="w-full max-w-xs">
        <Combobox
          items={frameworks}
          value={value}
          onValueChange={setValue}
          placeholder="Search a framework…"
          aria-label="Framework"
        />
      </div>
    </Preview>
  )
}
