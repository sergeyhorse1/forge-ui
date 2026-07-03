import { useCallback, useSyncExternalStore } from 'react'

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
  action?: React.ReactNode
  duration?: number
}

type ToastAction =
  | { type: 'ADD'; toast: ToastData }
  | { type: 'DISMISS'; id: string }
  | { type: 'REMOVE'; id: string }

interface ToastState {
  toasts: ToastData[]
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners = new Set<() => void>()
let state: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  switch (action.type) {
    case 'ADD':
      state = { toasts: [action.toast, ...state.toasts] }
      break
    case 'DISMISS':
    case 'REMOVE':
      state = { toasts: state.toasts.filter((t) => t.id !== action.id) }
      break
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return state
}

export interface ToastInput {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
  action?: React.ReactNode
  duration?: number
}

/** Imperatively show a toast. */
export function toast(input: ToastInput) {
  const id = genId()
  dispatch({ type: 'ADD', toast: { ...input, id } })
  return id
}

/** Dismiss a toast by id. */
export function dismissToast(id: string) {
  dispatch({ type: 'DISMISS', id })
}

/** Hook to access current toasts and control functions. */
export function useToast() {
  const { toasts } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const dismiss = useCallback((id: string) => {
    dispatch({ type: 'DISMISS', id })
  }, [])

  return { toasts, toast, dismiss }
}
