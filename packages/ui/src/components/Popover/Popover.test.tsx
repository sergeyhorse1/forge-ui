import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from './Popover'

function TestPopover({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Popover onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button>Open</button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Content</p>
        <PopoverClose asChild>
          <button>Close</button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}

describe('Popover', () => {
  it('renders trigger', () => {
    render(<TestPopover />)
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens on click', async () => {
    const user = userEvent.setup()
    render(<TestPopover />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText('Content')).toBeInTheDocument()
  })

  it('closes with close button', async () => {
    const user = userEvent.setup()
    render(<TestPopover />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByText('Content')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('calls onOpenChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TestPopover onOpenChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<TestPopover />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByText('Content')
    await user.keyboard('{Escape}')
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders controlled open state', () => {
    render(
      <Popover open>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Visible</PopoverContent>
      </Popover>,
    )
    expect(screen.getByText('Visible')).toBeInTheDocument()
  })
})
