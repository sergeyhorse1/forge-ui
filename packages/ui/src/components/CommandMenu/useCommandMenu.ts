import { useCallback, useEffect, useRef } from 'react'

import { useControllableState } from '../../hooks'

export interface UseCommandMenuParams {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hotkey?: boolean
}

export interface UseCommandMenuResult {
  open: boolean
  setOpen: (open: boolean) => void
  /**
   * Restores focus to the element focused before a hotkey-open. When a captured
   * opener exists it also prevents Radix's default restore via the passed event.
   */
  restoreFocus: (event?: Event) => void
  /** Captures the current focus target; call before opening programmatically. */
  captureOpener: () => void
}

/**
 * Owns the command menu's open state, the global ⌘K / Ctrl+K shortcut and the
 * focus-return bookkeeping used when the menu is opened without a trigger.
 */
export function useCommandMenu({
  open,
  defaultOpen,
  onOpenChange,
  hotkey = true,
}: UseCommandMenuParams): UseCommandMenuResult {
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  })

  // Элемент, у которого был фокус до открытия хоткеем — Radix-триггера тут нет.
  const openerRef = useRef<HTMLElement | null>(null)
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  const captureOpener = useCallback(() => {
    openerRef.current = document.activeElement as HTMLElement | null
  }, [])

  const restoreFocus = useCallback((event?: Event) => {
    const opener = openerRef.current
    openerRef.current = null
    if (opener && document.contains(opener)) {
      // Перебиваем дефолтный возврат фокуса Radix — при hotkey-открытии триггера нет.
      event?.preventDefault()
      opener.focus()
    }
  }, [])

  useEffect(() => {
    if (!hotkey) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return
      event.preventDefault()
      if (!isOpenRef.current) openerRef.current = document.activeElement as HTMLElement | null
      setOpenRef.current(!isOpenRef.current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [hotkey])

  return { open: isOpen, setOpen, restoreFocus, captureOpener }
}
