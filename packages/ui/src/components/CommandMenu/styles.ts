import { cva } from 'class-variance-authority'

export const commandVariants = cva(
  'flex w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground',
)

export const commandInputWrapperVariants = cva(
  // focus-within-ring на обёртке = видимый индикатор фокуса инпута (сам инпут outline-none).
  'flex items-center gap-2 border-b border-border px-3 focus-within:ring-2 focus-within:ring-inset focus-within:ring-ring',
)

export const commandInputVariants = cva(
  'flex h-11 w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
)

export const commandListVariants = cva('max-h-80 overflow-y-auto overflow-x-hidden p-1')

export const commandEmptyVariants = cva('py-6 text-center text-sm text-muted-foreground')

export const commandGroupVariants = cva(
  'overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground',
)

export const commandItemVariants = cva(
  // Активный пункт (aria-activedescendant) помечается data-[selected=true] силами cmdk.
  'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
)

export const commandShortcutVariants = cva(
  'ml-auto text-xs tracking-widest text-muted-foreground',
)
