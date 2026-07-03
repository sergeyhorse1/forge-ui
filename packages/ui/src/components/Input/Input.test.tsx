import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Name" />)
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
  })

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<Input defaultValue="" />)
    const input = screen.getByRole('textbox')
    await user.type(input, 'hello')
    expect(input).toHaveValue('hello')
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Input value="abc" onValueChange={onChange} />)
    expect(screen.getByRole('textbox')).toHaveValue('abc')
    rerender(<Input value="xyz" onValueChange={onChange} />)
    expect(screen.getByRole('textbox')).toHaveValue('xyz')
  })

  it('shows error message and sets aria attributes', () => {
    render(<Input error="Required field" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Required field')).toBeInTheDocument()
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Required field')).toHaveAttribute('id', errorId)
  })

  it('is disabled when disabled prop set', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('renders left and right addons', () => {
    render(<Input leftAddon={<span>$</span>} rightAddon={<span>.00</span>} />)
    expect(screen.getByText('$')).toBeInTheDocument()
    expect(screen.getByText('.00')).toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = { current: null } as React.RefObject<HTMLInputElement | null>
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
