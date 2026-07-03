import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RadioGroup } from './Radio'

const items = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]

describe('RadioGroup', () => {
  it('renders all radio items', () => {
    render(<RadioGroup items={items} />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<RadioGroup items={items} />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[1]!)
    expect(radios[1]!).toHaveAttribute('data-state', 'checked')
  })

  it('works in controlled mode', () => {
    const onChange = vi.fn()
    render(<RadioGroup items={items} value="b" onValueChange={onChange} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[1]!).toHaveAttribute('data-state', 'checked')
  })

  it('shows error with aria attributes', () => {
    render(<RadioGroup items={items} error="Select one" />)
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Select one')).toBeInTheDocument()
  })

  it('is disabled when disabled prop set', () => {
    render(<RadioGroup items={items} disabled />)
    const radios = screen.getAllByRole('radio')
    radios.forEach((r) => expect(r).toBeDisabled())
  })
})
