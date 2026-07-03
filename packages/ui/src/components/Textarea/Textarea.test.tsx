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
    const errorId = el.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Too short')).toHaveAttribute('id', errorId)
  })

  it('is disabled when disabled prop set', () => {
    render(<Textarea disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('sets rows attribute', () => {
    render(<Textarea rows={5} />)
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })

  it('renders all size variants without errors', () => {
    const { unmount: u1 } = render(<Textarea size="sm" placeholder="sm" />)
    expect(screen.getByPlaceholderText('sm')).toBeInTheDocument()
    u1()

    const { unmount: u2 } = render(<Textarea size="md" placeholder="md" />)
    expect(screen.getByPlaceholderText('md')).toBeInTheDocument()
    u2()

    render(<Textarea size="lg" placeholder="lg" />)
    expect(screen.getByPlaceholderText('lg')).toBeInTheDocument()
  })

  it('applies resize-none class when autoResize is enabled', () => {
    render(<Textarea autoResize placeholder="auto" />)
    const el = screen.getByRole('textbox')
    expect(el.className).toContain('resize-none')
  })
})
