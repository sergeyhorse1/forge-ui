import { useState } from 'react'
import { Command } from 'cmdk'

import { cn } from '../../utils/cn'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../Dialog'
import { useCommandMenu } from './useCommandMenu'
import type { CommandMenuItem, CommandMenuProps } from './types'
import {
  commandEmptyVariants,
  commandGroupVariants,
  commandInputVariants,
  commandInputWrapperVariants,
  commandItemVariants,
  commandListVariants,
  commandShortcutVariants,
  commandVariants,
} from './styles'

/** ⌘K command palette: filterable, grouped, with recents and focus return. */
export function CommandMenu({
  open,
  defaultOpen,
  onOpenChange,
  groups,
  recent,
  recentHeading = 'Recent',
  placeholder = 'Type a command or search…',
  emptyText = 'No results found.',
  label = 'Command menu',
  hotkey = true,
  onSelect,
  trigger,
}: CommandMenuProps) {
  const { open: isOpen, setOpen, restoreFocus } = useCommandMenu({
    open,
    defaultOpen,
    onOpenChange,
    hotkey,
  })
  const [search, setSearch] = useState('')

  const handleSelect = (item: CommandMenuItem) => {
    // Порядок важен: сначала действие пункта, затем внешний onSelect, затем закрытие
    // (фокус вернётся в onCloseAutoFocus).
    item.action?.()
    onSelect?.(item.value)
    setOpen(false)
  }

  const showRecent = recent && recent.length > 0 && search.trim() === ''

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        className="max-w-xl gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
        onCloseAutoFocus={restoreFocus}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <Command label={label} className={cn(commandVariants())}>
          <div className={cn(commandInputWrapperVariants())}>
            <SearchIcon />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={placeholder}
              className={cn(commandInputVariants())}
            />
          </div>
          <Command.List className={cn(commandListVariants())}>
            <Command.Empty className={cn(commandEmptyVariants())}>{emptyText}</Command.Empty>

            {showRecent ? (
              <Command.Group heading={recentHeading} className={cn(commandGroupVariants())}>
                {recent.map((item) => (
                  <CommandRow key={`recent-${item.value}`} item={item} onSelect={handleSelect} />
                ))}
              </Command.Group>
            ) : null}

            {groups.map((group) => (
              <Command.Group
                key={group.heading}
                heading={group.heading}
                className={cn(commandGroupVariants())}
              >
                {group.items.map((item) => (
                  <CommandRow key={item.value} item={item} onSelect={handleSelect} />
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandRow({
  item,
  onSelect,
}: {
  item: CommandMenuItem
  onSelect: (item: CommandMenuItem) => void
}) {
  return (
    <Command.Item
      value={item.value}
      keywords={item.keywords}
      disabled={item.disabled}
      onSelect={() => onSelect(item)}
      className={cn(commandItemVariants())}
    >
      {item.icon ? (
        <span className="flex size-4 items-center justify-center" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
      <span>{item.label}</span>
      {item.shortcut ? <span className={cn(commandShortcutVariants())}>{item.shortcut}</span> : null}
    </Command.Item>
  )
}

function SearchIcon() {
  return (
    <svg
      className="size-4 shrink-0 text-muted-foreground"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
