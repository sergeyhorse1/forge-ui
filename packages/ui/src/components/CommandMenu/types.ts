import type { ReactNode } from 'react'

/** A single command palette entry. */
export interface CommandMenuItem {
  /** Stable value used for filtering and reported on selection. */
  value: string
  /** Visible label. */
  label: ReactNode
  /** Extra terms cmdk matches against besides the label. */
  keywords?: string[]
  /** Leading icon. */
  icon?: ReactNode
  /** Trailing hint (e.g. a shortcut). */
  shortcut?: ReactNode
  /** Disable selection. */
  disabled?: boolean
  /** Invoked when the item is chosen, before the menu closes. */
  action?: () => void
}

/** A titled group of command items. */
export interface CommandMenuGroup {
  /** Group heading. */
  heading: string
  /** Items in the group. */
  items: CommandMenuItem[]
}

export interface CommandMenuProps {
  /** Controlled open state. */
  open?: boolean
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean
  /** Open state change handler. */
  onOpenChange?: (open: boolean) => void
  /** Grouped commands. */
  groups: CommandMenuGroup[]
  /** Recently used items shown on top while the search is empty. */
  recent?: CommandMenuItem[]
  /** Heading for the recent group. */
  recentHeading?: string
  /** Input placeholder. */
  placeholder?: string
  /** Text shown when nothing matches. */
  emptyText?: string
  /** Accessible name for the dialog (rendered as a visually hidden title). */
  label?: string
  /** Enable the global ⌘K / Ctrl+K shortcut. Defaults to true. */
  hotkey?: boolean
  /** Called with the selected item value after its action runs. */
  onSelect?: (value: string) => void
  /** Optional element that opens the menu on click. */
  trigger?: ReactNode
}
