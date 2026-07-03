import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Switch } from './Switch'

describe('Switch', () => {
  it('renders a switch', () => {
    render(<Switch label="Dark mode" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
    expect(screen.getByText('Dark mode')).toBeInTheDocument()
  })

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<Switch label="Toggle" />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('data-state', 'unchecked')
    await user.click(sw)
    expect(sw).toHaveAttribute('data-state', 'checked')
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    render(<Switch checked={true} onCheckedChange={onChange} label="On" />)
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'checked')
  })

  it('shows error with aria attributes', () => {
    render(<Switch error="Required" label="Notifications" />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-invalid', 'true')
    const errorId = sw.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Required')).toHaveAttribute('id', errorId)
  })

  it('is disabled when disabled prop set', () => {
    render(<Switch disabled label="Nope" />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('calls onCheckedChange on click', async () => {
    const handler = vi.fn()
    const user = userEvent.setup()
    render(<Switch onCheckedChange={handler} label="Click me" />)
    await user.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('renders all size variants without errors', () => {
    const { unmount: u1 } = render(<Switch size="sm" label="Small" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
    u1()

    const { unmount: u2 } = render(<Switch size="md" label="Medium" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
    u2()

    render(<Switch size="lg" label="Large" />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('toggles via Space key', async () => {
    const user = userEvent.setup()
    render(<Switch label="Space test" />)
    const sw = screen.getByRole('switch')
    sw.focus()
    await user.keyboard(' ')
    expect(sw).toHaveAttribute('data-state', 'checked')
  })

  it('toggles via Enter key', async () => {
    const user = userEvent.setup()
    render(<Switch label="Enter test" />)
    const sw = screen.getByRole('switch')
    sw.focus()
    await user.keyboard('{Enter}')
    expect(sw).toHaveAttribute('data-state', 'checked')
  })
})
