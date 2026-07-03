import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea placeholder="Write here" />)
    expect(screen.getByPlaceholderText('Write here')).toBeInTheDocument()
  })

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<Textarea defaultValue="" />)
    const el = screen.getByRole('textbox')
    await user.type(el, 'hello')
    expect(el).toHaveValue('hello')
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Textarea value="abc" onValueChange={onChange} />)
    expect(screen.getByRole('textbox')).toHaveValue('abc')
    rerender(<Textarea value="xyz" onValueChange={onChange} />)
    expect(screen.getByRole('textbox')).toHaveValue('xyz')
  })

  it('shows error with aria attributes', () => {
    render(<Textarea error="Too short" />)
    const el = screen.getByRole('textbox')
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Too short')).toBeInTheDocument()
  })

  it('is disabled when disabled prop set', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('sets rows attribute', () => {
    render(<Textarea rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })
})
