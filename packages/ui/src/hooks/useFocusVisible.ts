import { useSyncExternalStore } from 'react'

// Стартуем в pointer-модальности: клиентский снапшот совпадает с SSR (false),
// без гидрационного рассинхрона и мигания фокус-ринга на первом paint.
let hadKeyboardEvent = false
let isListening = false
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function onKeyDown(event: KeyboardEvent): void {
  // Чистые модификаторы (Ctrl+клик) не переключают модальность на клавиатуру.
  if (event.metaKey || event.altKey || event.ctrlKey) return
  if (!hadKeyboardEvent) {
    hadKeyboardEvent = true
    notify()
  }
}

function onPointerDown(): void {
  if (hadKeyboardEvent) {
    hadKeyboardEvent = false
    notify()
  }
}

function ensureListening(): void {
  if (isListening || typeof document === 'undefined') return
  isListening = true
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('pointerdown', onPointerDown, true)
}

function subscribe(onChange: () => void): () => void {
  ensureListening()
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot(): boolean {
  return hadKeyboardEvent
}

function getServerSnapshot(): boolean {
  return false
}

/** Whether the most recent global interaction came from the keyboard. */
export function useFocusVisible(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
