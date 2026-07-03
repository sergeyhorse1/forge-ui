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
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    const errorId = group.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Select one')).toHaveAttribute('id', errorId)
  })

  it('is disabled when disabled prop set', () => {
    render(<RadioGroup items={items} disabled />)
    const radios = screen.getAllByRole('radio')
    radios.forEach((r) => expect(r).toBeDisabled())
  })

  it('renders all size variants without errors', () => {
    const { unmount: u1 } = render(<RadioGroup items={items} size="sm" />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    u1()

    const { unmount: u2 } = render(<RadioGroup items={items} size="md" />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    u2()

    render(<RadioGroup items={items} size="lg" />)
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('calls onValueChange when selecting a different option', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<RadioGroup items={items} defaultValue="a" onValueChange={onChange} />)
    const radios = screen.getAllByRole('radio')
    await user.click(radios[2]!)
    expect(onChange).toHaveBeenCalledWith('c')
  })
})
