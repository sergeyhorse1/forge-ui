import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Select } from './Select'

const items = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

describe('Select', () => {
  it('renders a combobox trigger', () => {
    render(<Select items={items} placeholder="Pick fruit" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('shows placeholder text', () => {
    render(<Select items={items} placeholder="Pick fruit" />)
    expect(screen.getByText('Pick fruit')).toBeInTheDocument()
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    render(<Select items={items} value="banana" onValueChange={onChange} />)
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('shows error with aria attributes', () => {
    render(<Select items={items} error="Required" placeholder="Choose" />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    const errorId = trigger.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Required')).toHaveAttribute('id', errorId)
  })

  it('is disabled when disabled prop set', () => {
    render(<Select items={items} disabled placeholder="No" />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('renders with default value', () => {
    render(<Select items={items} defaultValue="cherry" placeholder="Pick" />)
    expect(screen.getByText('Cherry')).toBeInTheDocument()
  })

  it('renders all size variants without errors', () => {
    const { unmount: u1 } = render(<Select items={items} size="sm" placeholder="sm" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    u1()

    const { unmount: u2 } = render(<Select items={items} size="md" placeholder="md" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    u2()

    render(<Select items={items} size="lg" placeholder="lg" />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('trigger has correct aria attributes for accessibility', () => {
    render(<Select items={items} placeholder="Pick" />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-autocomplete', 'none')
  })
})
