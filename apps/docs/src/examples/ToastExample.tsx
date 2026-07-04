import {
  Button,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  toast,
  useToast,
} from '@sergeyhorse/forge'

import { Preview } from './Preview'

function ToastList() {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {toasts.map((item) => (
        <Toast
          key={item.id}
          open
          variant={item.variant}
          onOpenChange={(open) => {
            if (!open) dismiss(item.id)
          }}
        >
          <div className="grid gap-1">
            {item.title ? <ToastTitle>{item.title}</ToastTitle> : null}
            {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  )
}

export function ToastExample() {
  return (
    <Preview>
      <ToastProvider>
        <Button
          variant="outline"
          onClick={() =>
            toast({ title: 'Changes saved', description: 'Your workspace is up to date.' })
          }
        >
          Show toast
        </Button>
        <ToastList />
        <ToastViewport className="top-auto bottom-0" />
      </ToastProvider>
    </Preview>
  )
}
