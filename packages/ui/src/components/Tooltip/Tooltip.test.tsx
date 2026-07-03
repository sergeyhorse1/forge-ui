import '@testing-library/jest-dom/vitest'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { Tooltip } from './Tooltip'

// jsdom не предоставляет ResizeObserver, который Popper использует для замера
// стрелки (Tooltip.Arrow) — без него контент не монтируется.
beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('Tooltip', () => {
  it('renders trigger', () => {
    render(<Tooltip content="Tip"><button>Hover</button></Tooltip>)
    expect(screen.getByRole('button', { name: 'Hover' })).toBeInTheDocument()
  })

  it('shows content on hover', async () => {
    const user = userEvent.setup()
    render(<Tooltip content="Tip text" delayDuration={0}><button>Hover</button></Tooltip>)
    await user.hover(screen.getByRole('button', { name: 'Hover' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Tip text')
  })

  it('supports controlled open', () => {
    render(<Tooltip content="Controlled" open><button>Trigger</button></Tooltip>)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('calls onOpenChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Tooltip content="Tip" onOpenChange={onChange} delayDuration={0}>
        <button>Trigger</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button', { name: 'Trigger' }))
    await screen.findByRole('tooltip')
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('wraps plain text content when asChild is disabled', () => {
    render(
      <Tooltip content="Tip" asChild={false}>
        Plain label
      </Tooltip>,
    )
    expect(screen.getByRole('button', { name: 'Plain label' })).toBeInTheDocument()
  })

  it('renders arrow by default and omits it when arrow=false', () => {
    const { rerender } = render(
      <Tooltip content="With arrow" open>
        <button>Trigger</button>
      </Tooltip>,
    )
    expect(document.querySelector('.fill-popover')).toBeInTheDocument()

    rerender(
      <Tooltip content="No arrow" arrow={false} open>
        <button>Trigger</button>
      </Tooltip>,
    )
    expect(document.querySelector('.fill-popover')).not.toBeInTheDocument()
  })
})
