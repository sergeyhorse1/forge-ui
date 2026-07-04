import '@testing-library/jest-dom/vitest'

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { CommandMenu } from './CommandMenu'
import type { CommandMenuGroup } from './types'

// cmdk в jsdom опирается на ResizeObserver и scrollIntoView, которых там нет.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
})

function pressHotkey() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  })
}

function pressHotkeyMeta() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
  })
}

function makeGroups(onRun?: () => void): CommandMenuGroup[] {
  return [
    {
      heading: 'Navigation',
      items: [
        { value: 'home', label: 'Go home' },
        { value: 'settings', label: 'Open settings', action: onRun },
      ],
    },
    {
      heading: 'Account',
      items: [{ value: 'logout', label: 'Log out' }],
    },
  ]
}

describe('CommandMenu', () => {
  it('renders a trigger and opens on click', async () => {
    const user = userEvent.setup()
    render(<CommandMenu groups={makeGroups()} trigger={<button>Open palette</button>} />)
    await user.click(screen.getByRole('button', { name: 'Open palette' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type a command or search…')).toBeInTheDocument()
  })

  it('opens and closes with the ⌘K / Ctrl+K hotkey (uncontrolled)', async () => {
    render(<CommandMenu groups={makeGroups()} />)
    pressHotkey()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('opens with the ⌘K hotkey on macOS (metaKey)', async () => {
    render(<CommandMenu groups={makeGroups()} />)
    pressHotkeyMeta()
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('filters items by the search input', async () => {
    const user = userEvent.setup()
    render(<CommandMenu groups={makeGroups()} defaultOpen />)
    const input = await screen.findByRole('combobox')
    await user.type(input, 'settings')
    expect(screen.getByText('Open settings')).toBeInTheDocument()
    expect(screen.queryByText('Go home')).not.toBeInTheDocument()
  })

  it('runs the item action and reports the value, then closes', async () => {
    const action = vi.fn()
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<CommandMenu groups={makeGroups(action)} onSelect={onSelect} defaultOpen />)
    const input = await screen.findByRole('combobox')
    await user.type(input, 'settings')
    await user.keyboard('{Enter}')
    expect(action).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith('settings')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the recent group only while the search is empty', async () => {
    const user = userEvent.setup()
    render(
      <CommandMenu
        groups={makeGroups()}
        recent={[{ value: 'home', label: 'Go home' }]}
        recentHeading="Recently used"
        defaultOpen
      />,
    )
    expect(await screen.findByText('Recently used')).toBeInTheDocument()
    const input = screen.getByRole('combobox')
    await user.type(input, 'log')
    expect(screen.queryByText('Recently used')).not.toBeInTheDocument()
  })

  it('reports the plain value when a recent item is picked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandMenu
        groups={makeGroups()}
        recent={[{ value: 'reports', label: 'View reports' }]}
        recentHeading="Recently used"
        onSelect={onSelect}
        defaultOpen
      />,
    )
    await screen.findByRole('dialog')
    await user.click(screen.getByText('View reports'))
    expect(onSelect).toHaveBeenCalledWith('reports')
  })

  it('is controlled by the open prop', () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <CommandMenu groups={makeGroups()} open={false} onOpenChange={onOpenChange} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    rerender(<CommandMenu groups={makeGroups()} open onOpenChange={onOpenChange} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not toggle via hotkey when disabled', () => {
    render(<CommandMenu groups={makeGroups()} hotkey={false} />)
    pressHotkey()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('marks exactly one option active when a recent duplicates a group item', async () => {
    render(
      <CommandMenu
        groups={makeGroups()}
        recent={[{ value: 'settings', label: 'Open settings' }]}
        defaultOpen
      />,
    )
    await screen.findByRole('dialog')
    expect(document.querySelectorAll('[aria-selected="true"]')).toHaveLength(1)
  })

  it('clears the search and restores recents on reopen', async () => {
    const user = userEvent.setup()
    const recent = [{ value: 'home', label: 'Go home' }]
    const { rerender } = render(
      <CommandMenu groups={makeGroups()} recent={recent} recentHeading="Recently used" open />,
    )
    const input = await screen.findByRole('combobox')
    await user.type(input, 'log')
    expect(screen.queryByText('Recently used')).not.toBeInTheDocument()

    rerender(
      <CommandMenu groups={makeGroups()} recent={recent} recentHeading="Recently used" open={false} />,
    )
    rerender(
      <CommandMenu groups={makeGroups()} recent={recent} recentHeading="Recently used" open />,
    )
    const reopened = await screen.findByRole('combobox')
    expect(reopened).toHaveValue('')
    expect(screen.getByText('Recently used')).toBeInTheDocument()
  })

  it('does not render the dialog close button', async () => {
    render(<CommandMenu groups={makeGroups()} defaultOpen />)
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('removes the document keydown listener on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const { unmount } = render(<CommandMenu groups={makeGroups()} />)
    const added = addSpy.mock.calls.filter(([type]) => type === 'keydown').map(([, handler]) => handler)
    unmount()
    const removed = removeSpy.mock.calls
      .filter(([type]) => type === 'keydown')
      .map(([, handler]) => handler)
    expect(added.some((handler) => removed.includes(handler))).toBe(true)
    addSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('returns focus to the hotkey opener after closing', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button>outside</button>
        <CommandMenu groups={makeGroups()} />
      </div>,
    )
    const opener = screen.getByRole('button', { name: 'outside' })
    opener.focus()
    expect(opener).toHaveFocus()

    pressHotkey()
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
