import type { VariantProps } from 'class-variance-authority'

import type { comboboxInputVariants } from './styles'

/** Single selectable option. */
export interface ComboboxItem {
  /** Value committed on selection. */
  value: string
  /** Visible label, also used for filtering. */
  label: string
  /** When true the option is shown but cannot be chosen. */
  disabled?: boolean
}

/** Labelled cluster of options rendered under a heading. */
export interface ComboboxGroup {
  /** Group heading. */
  label: string
  /** Options belonging to the group. */
  items: ComboboxItem[]
}

/** Either a flat list of options or a list of labelled groups. */
export type ComboboxItems = readonly ComboboxItem[] | readonly ComboboxGroup[]

export type ComboboxVariantProps = VariantProps<typeof comboboxInputVariants>

/** Async loader: receives the current query, resolves the matching options. */
export type ComboboxLoader = (query: string) => Promise<ComboboxItems>

export interface ComboboxProps extends ComboboxVariantProps {
  /** Static options for the synchronous, client-filtered mode. */
  items?: ComboboxItems
  /** Loader for the async mode; called with the debounced query. */
  loadItems?: ComboboxLoader
  /** Debounce applied to the query before `loadItems` runs. */
  debounceMs?: number
  /** Controlled selected value. */
  value?: string
  /** Initial selected value in uncontrolled mode. */
  defaultValue?: string
  /** Called with the new value on selection. */
  onValueChange?: (value: string) => void
  /** Controlled open state. */
  open?: boolean
  /** Initial open state in uncontrolled mode. */
  defaultOpen?: boolean
  /** Called when the listbox opens or closes. */
  onOpenChange?: (open: boolean) => void
  /** Controlled input text. */
  inputValue?: string
  /** Initial input text in uncontrolled mode. */
  defaultInputValue?: string
  /** Called with the new input text as the user types. */
  onInputValueChange?: (value: string) => void
  /** Placeholder shown when the input is empty. */
  placeholder?: string
  /** Disables the whole control. */
  disabled?: boolean
  /** Error message; also toggles the invalid styling. */
  error?: string
  /** Text shown while an async request is in flight. */
  loadingText?: string
  /** Text shown when there are no matching options. */
  emptyText?: string
  /** Extra class names for the input. */
  className?: string
  /** Accessible name when no visible label is associated. */
  'aria-label'?: string
  /** ID of an element labelling the input. */
  'aria-labelledby'?: string
}
