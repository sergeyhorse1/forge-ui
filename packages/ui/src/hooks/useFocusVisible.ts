import { useSyncExternalStore } from 'react'

/**
 * Global keyboard-modality tracker.
 *
 * `:focus-visible` is the right tool in CSS, but components sometimes need the
 * same signal in JS (e.g. to decide whether to show a focus ring on a custom
 * widget). We watch the document for the last interaction type and expose it as
 * a boolean: `true` after keyboard input, `false` after pointer input.
 */

let hadKeyboardEvent = true
let isListening = false
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

function onKeyDown(event: KeyboardEvent): void {
  // Modifier-only presses (e.g. holding Ctrl while clicking) should not flip the
  // modality to keyboard.
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
