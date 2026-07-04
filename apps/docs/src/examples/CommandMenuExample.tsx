import { useState } from 'react'
import { Button, CommandMenu } from '@sergeyhorse/forge'
import type { CommandMenuGroup } from '@sergeyhorse/forge'

import { Preview } from './Preview'

const groups: CommandMenuGroup[] = [
  {
    heading: 'Navigation',
    items: [
      { value: 'dashboard', label: 'Go to dashboard', shortcut: 'G D' },
      { value: 'projects', label: 'Go to projects', shortcut: 'G P' },
      { value: 'settings', label: 'Open settings', shortcut: 'G S' },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { value: 'new-project', label: 'Create new project' },
      { value: 'invite', label: 'Invite teammate' },
    ],
  },
]

export function CommandMenuExample() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <Preview>
      <div className="flex flex-col gap-2">
        <CommandMenu
          groups={groups}
          onSelect={setSelected}
          trigger={<Button variant="outline">Open command menu (⌘K)</Button>}
        />
        <p className="text-muted-foreground text-sm">Selected: {selected ?? '—'}</p>
      </div>
    </Preview>
  )
}
