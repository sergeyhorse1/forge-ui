import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import { CommandMenu } from './CommandMenu'
import type { CommandMenuGroup, CommandMenuItem } from './types'
import { Button } from '../Button'

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
      { value: 'logout', label: 'Log out' },
    ],
  },
]

const recent: CommandMenuItem[] = [{ value: 'projects', label: 'Go to projects' }]

const meta = {
  title: 'Components/CommandMenu',
  component: CommandMenu,
  tags: ['autodocs'],
  args: { groups },
} satisfies Meta<typeof CommandMenu>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CommandMenu
        groups={groups}
        recent={recent}
        onSelect={setSelected}
        trigger={<Button variant="outline">Open command menu (⌘K)</Button>}
      />
      <p style={{ fontSize: 12 }} data-testid="selection">
        Selected: {selected ?? '—'}
      </p>
    </div>
  )
}

export const Default: Story = {
  render: () => <Demo />,
}

export const HotkeyAndFocusReturn: Story = {
  tags: ['test'],
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const opener = canvas.getByRole('button', { name: /Open command menu/ })
    opener.focus()
    await expect(opener).toHaveFocus()

    // Хоткей открывает меню (триггера не касаемся).
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    const dialog = await within(document.body).findByRole('dialog')
    const input = within(dialog).getByRole('combobox')
    await expect(input).toHaveFocus()

    // Ввод фильтрует список.
    await userEvent.type(input, 'settings')
    await expect(within(dialog).getByText('Open settings')).toBeInTheDocument()
    await expect(within(dialog).queryByText('Go to dashboard')).toBeNull()

    // Enter выполняет action и закрывает меню.
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByTestId('selection')).toHaveTextContent('Selected: settings')

    // Фокус вернулся на опенер.
    await expect(opener).toHaveFocus()
  },
}

export const EmptyState: Story = {
  tags: ['test'],
  // cmdk сохраняет role="listbox" и в no-results состоянии, где нет option-детей —
  // axe aria-required-children тут ложно-срабатывает на пустом списке. Отключаем
  // только это правило и только здесь; стори с результатами проверяют его полностью.
  parameters: {
    a11y: { config: { rules: [{ id: 'aria-required-children', enabled: false }] } },
  },
  render: () => <CommandMenu groups={groups} defaultOpen emptyText="Nothing matches that." />,
  play: async () => {
    const dialog = await within(document.body).findByRole('dialog')
    const input = within(dialog).getByRole('combobox')
    await userEvent.type(input, 'zzzzzz')
    await expect(within(dialog).getByText('Nothing matches that.')).toBeInTheDocument()
  },
}
