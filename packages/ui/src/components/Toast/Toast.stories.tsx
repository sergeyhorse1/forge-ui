import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
} from './Toast'
import { useToast, toast as toastFn } from './use-toast'

const meta = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  args: {
    children: null as unknown as React.ReactNode,
    open: true,
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
        <ToastViewport />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Toast {...args}>
      <div className="grid gap-1">
        <ToastTitle>Notification</ToastTitle>
        <ToastDescription>Something happened.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
}

export const Success: Story = {
  render: (args) => (
    <Toast {...args} variant="success">
      <div className="grid gap-1">
        <ToastTitle>Success</ToastTitle>
        <ToastDescription>Operation completed.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
}

export const Destructive: Story = {
  render: (args) => (
    <Toast {...args} variant="destructive">
      <div className="grid gap-1">
        <ToastTitle>Error</ToastTitle>
        <ToastDescription>Something went wrong.</ToastDescription>
      </div>
      <ToastClose />
    </Toast>
  ),
}

export const WithAction: Story = {
  render: (args) => (
    <Toast {...args}>
      <div className="grid gap-1">
        <ToastTitle>Event created</ToastTitle>
        <ToastDescription>Friday, Feb 10 at 5:57 PM</ToastDescription>
      </div>
      <ToastAction altText="Undo action">Undo</ToastAction>
      <ToastClose />
    </Toast>
  ),
}

function ImperativeDemo() {
  const { toasts, dismiss } = useToast()

  return (
    <div>
      <button onClick={() => toastFn({ title: 'Hello', description: 'Imperative toast' })}>
        Show toast
      </button>
      {toasts.map((t) => (
        <Toast key={t.id} open onOpenChange={(open) => { if (!open) dismiss(t.id) }} variant={t.variant}>
          <div className="grid gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </div>
  )
}

export const Imperative: Story = {
  render: () => <ImperativeDemo />,
}
