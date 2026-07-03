import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Checkbox } from './Checkbox'

describe('Checkbox', () => {
  it('renders a checkbox', () => {
    render(<Checkbox label="Accept" />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('Accept')).toBeInTheDocument()
  })

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Toggle" />)
    const cb = screen.getByRole('checkbox')
    expect(cb).toHaveAttribute('data-state', 'unchecked')
    await user.click(cb)
    expect(cb).toHaveAttribute('data-state', 'checked')
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    render(<Checkbox checked={true} onCheckedChange={onChange} label="On" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'checked')
  })

  it('shows error with aria attributes', () => {
    render(<Checkbox error="Must accept" label="Terms" />)
    const cb = screen.getByRole('checkbox')
    expect(cb).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Must accept')).toBeInTheDocument()
  })

  it('is disabled when disabled prop set', () => {
    render(<Checkbox disabled label="Nope" />)
    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('supports indeterminate state', () => {
    render(<Checkbox checked="indeterminate" label="Partial" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('data-state', 'indeterminate')
  })
})
