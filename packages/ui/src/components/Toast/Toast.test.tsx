import '@testing-library/jest-dom/vitest'

import { render, screen, act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './Toast'
import { toast, useToast, dismissToast } from './use-toast'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastViewport />
    </ToastProvider>
  )
}

describe('Toast', () => {
  it('renders toast with title and description', () => {
    render(
      <Wrapper>
        <Toast open>
          <ToastTitle>Title</ToastTitle>
          <ToastDescription>Desc</ToastDescription>
          <ToastClose />
        </Toast>
      </Wrapper>,
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
  })

  it('renders variant classes', () => {
    const { container } = render(
      <Wrapper>
        <Toast open variant="destructive">
          <ToastTitle>Error</ToastTitle>
        </Toast>
      </Wrapper>,
    )
    const toastEl = container.querySelector('[data-state="open"]')
    expect(toastEl?.className).toContain('destructive')
  })

  it('renders viewport', () => {
    render(
      <Wrapper>
        <Toast open>
          <ToastTitle>Test</ToastTitle>
        </Toast>
      </Wrapper>,
    )
    expect(screen.getByRole('region')).toBeInTheDocument()
  })
})

describe('useToast', () => {
  function ToastConsumer() {
    const { toasts } = useToast()
    return (
      <div>
        {toasts.map((t) => (
          <span key={t.id}>{t.title}</span>
        ))}
      </div>
    )
  }

  it('adds and dismisses toasts imperatively', () => {
    render(<ToastConsumer />)

    let id: string
    act(() => { id = toast({ title: 'Imperative' }) })
    expect(screen.getByText('Imperative')).toBeInTheDocument()

    act(() => { dismissToast(id!) })
    expect(screen.queryByText('Imperative')).not.toBeInTheDocument()
  })
})
