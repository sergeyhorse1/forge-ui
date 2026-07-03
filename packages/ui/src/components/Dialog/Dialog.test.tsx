import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './Dialog'

function TestDialog({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button>Open</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <button>Dismiss</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('renders trigger', () => {
    render(<TestDialog />)
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens on trigger click', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('closes with close button', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('marks the content as an aria modal', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes with ESC key', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onOpenChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TestDialog onOpenChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('returns focus to the trigger after closing', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    const trigger = screen.getByRole('button', { name: 'Open' })
    await user.click(trigger)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('renders controlled open state', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Controlled</DialogTitle>
          <DialogDescription>Visible</DialogDescription>
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
