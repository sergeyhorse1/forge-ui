import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from './Toolbar'

function TestToolbar() {
  return (
    <Toolbar aria-label="Formatting">
      <ToolbarToggleGroup type="single" defaultValue="left" aria-label="Align">
        <ToolbarToggleItem value="left">Left</ToolbarToggleItem>
        <ToolbarToggleItem value="center">Center</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton>Save</ToolbarButton>
      <ToolbarLink href="#help">Help</ToolbarLink>
    </Toolbar>
  )
}

describe('Toolbar', () => {
  it('exposes the toolbar role', () => {
    render(<TestToolbar />)
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
  })

  it('renders button and link items', () => {
    render(<TestToolbar />)
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Help' })).toBeInTheDocument()
  })

  it('reflects the pressed toggle', () => {
    render(<TestToolbar />)
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('data-state', 'on')
  })

  it('moves focus between items with arrow keys (roving tabindex)', async () => {
    const user = userEvent.setup()
    render(<TestToolbar />)
    await user.tab()
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Center' })).toHaveFocus()
  })

  it('jumps to the first and last item with Home and End', async () => {
    const user = userEvent.setup()
    render(<TestToolbar />)
    await user.tab()
    await user.keyboard('{End}')
    expect(screen.getByRole('link', { name: 'Help' })).toHaveFocus()
    await user.keyboard('{Home}')
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveFocus()
  })
})
