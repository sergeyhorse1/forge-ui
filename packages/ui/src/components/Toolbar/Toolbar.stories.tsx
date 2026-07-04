import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'

import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from './Toolbar'

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  tags: ['test'],
  render: () => (
    <Toolbar aria-label="Text formatting">
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold">Bold</ToolbarToggleItem>
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
        <ToolbarToggleItem value="underline">Underline</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton>Share</ToolbarButton>
      <ToolbarLink href="#docs">Docs</ToolbarLink>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument()

    await userEvent.tab()
    const bold = canvas.getByRole('button', { name: 'Bold' })
    await expect(bold).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')
    await expect(canvas.getByRole('button', { name: 'Italic' })).toHaveFocus()

    await userEvent.keyboard(' ')
    await expect(bold).not.toHaveAttribute('data-state', 'on')
    await expect(canvas.getByRole('button', { name: 'Italic' })).toHaveAttribute('data-state', 'on')
  },
}

export const Vertical: Story = {
  render: () => (
    <Toolbar aria-label="Tools" orientation="vertical" style={{ width: 140 }}>
      <ToolbarButton>Cut</ToolbarButton>
      <ToolbarButton>Copy</ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton>Paste</ToolbarButton>
    </Toolbar>
  ),
}
