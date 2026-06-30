import { cva } from 'class-variance-authority'

/**
 * Presentation tokens for the FilterBuilder, authored as `cva` blocks so the
 * tree view never hand-concatenates class strings. Colours come from the shared
 * semantic tokens (`--color-*`), so light and dark themes are handled by the
 * `data-theme` overrides in globals.css — no `dark:` variants needed here.
 */

export const builderRoot = cva('text-sm text-foreground')

/**
 * A group panel. Depth is read primarily through the real border colour and a
 * concrete left indent (not a faint alpha), so nesting stays verifiable by a
 * computed-paint check on both themes. The root sits on `bg-card`; nested groups
 * use a slightly recessed surface plus the inherited indent from their parent.
 */
export const groupPanel = cva(
  'flex flex-col gap-3 rounded-md border border-border p-3',
  {
    variants: {
      root: {
        true: 'bg-card',
        false: 'bg-muted/40',
      },
    },
    defaultVariants: { root: true },
  },
)

/** Header row of a group: combinator toggle on the left, group actions right. */
export const groupHeader = cva('flex items-center justify-between gap-2')

/** Concrete indent for a group's children so depth >= 2 reads geometrically. */
export const groupChildren = cva('flex flex-col gap-2 border-l border-border pl-4')

/** The two-button AND/OR toggle, grouped as a single segmented control. */
export const combinatorToggle = cva(
  'inline-flex overflow-hidden rounded-md border border-border',
)

/**
 * One segment of the combinator toggle. The active segment carries the primary
 * surface (>= 4.5:1 against `primary-foreground`); the inactive one is muted but
 * still legible, with a clear hover and a focus ring for keyboard users.
 *
 * Active vs inactive is signalled by font weight as well as fill, so the state
 * is distinguishable without relying on colour alone (WCAG 1.4.1).
 */
export const combinatorButton = cva(
  'px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      active: {
        true: 'bg-primary font-semibold text-primary-foreground',
        false: 'bg-muted font-normal text-muted-foreground hover:bg-muted/70',
      },
    },
    defaultVariants: { active: false },
  },
)

/** Add-rule / add-group buttons: low-emphasis bordered actions. */
export const addButton = cva(
  'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

/** Footer holding the add-rule / add-group buttons of a group. */
export const groupActions = cva('flex items-center gap-2')

/**
 * Destructive remove button (rule or non-root group). Kept icon-sized with an
 * accessible name supplied via `aria-label` at the call site; hover lifts it to
 * the destructive surface so the affordance reads in both themes.
 */
export const removeButton = cva(
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

/** One rule row: field / operator / value controls laid out with flex. */
export const ruleRow = cva(
  'flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2',
)

/** Native control inside a rule (input / select), styled to match the panels. */
export const ruleControl = cva(
  'h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)
