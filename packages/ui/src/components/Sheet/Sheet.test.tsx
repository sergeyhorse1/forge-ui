import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from './Sheet'

function TestSheet({
  side = 'right',
  onOpenChange,
}: {
  side?: 'left' | 'right' | 'top' | 'bottom'
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button>Open</button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Title</SheetTitle>
          <SheetDescription>Desc</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <button>Done</button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

describe('Sheet', () => {
  it('renders trigger', () => {
    render(<TestSheet />)
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('opens on trigger click', async () => {
    const user = userEvent.setup()
    render(<TestSheet />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('closes with ESC', async () => {
    const user = userEvent.setup()
    render(<TestSheet />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders all side variants', async () => {
    const user = userEvent.setup()
    for (const side of ['left', 'right', 'top', 'bottom'] as const) {
      const { unmount } = render(<TestSheet side={side} />)
      await user.click(screen.getByRole('button', { name: 'Open' }))
      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      unmount()
    }
  })

  it('calls onOpenChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<TestSheet onOpenChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('renders controlled open state', () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Controlled</SheetTitle>
          <SheetDescription>Visible</SheetDescription>
        </SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
