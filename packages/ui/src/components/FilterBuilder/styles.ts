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
 *
 * The base focus ring is `ring-ring`, which reads on the inactive (`bg-muted`)
 * segment. The active segment is filled with `bg-primary`, and `--color-ring`
 * equals `--color-primary`, so the same ring would be invisible there (1:1
 * contrast); the `active:true` variant overrides it to `ring-primary-foreground`
 * — the same colour as the active label, so the ring is guaranteed to contrast
 * against `bg-primary`. `tailwind-merge` collapses the two ring-colour utilities
 * so only the variant's wins on the active segment. `ring-inset` is kept: the
 * inset ring sits inside the button box, so the toggle's `overflow-hidden` does
 * not clip it.
 */
export const combinatorButton = cva(
  'px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
  {
    variants: {
      active: {
        true: 'bg-primary font-semibold text-primary-foreground focus-visible:ring-primary-foreground',
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

/**
 * Wrapper for a range (`between`) operator's two value controls. Laid out with
 * flex (deliberately not a two-column grid, which the dist guard forbids) so the
 * pair shares the remaining row width and still wraps on a narrow container.
 */
export const ruleRangeGroup = cva('flex min-w-0 flex-1 items-center gap-2')

/** The "to" separator between the two range controls. */
export const ruleRangeSeparator = cva('shrink-0 text-xs text-muted-foreground')

/** Multi-select value control: a little taller so several rows are visible. */
export const ruleMultiControl = cva(
  'min-h-16 min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
)

/**
 * Read-only compact summary. Chips wrap and long values break so a narrow
 * container (≈360px) never overflows horizontally — the very failure mode the
 * editable controls hit at that width, which compact mode replaces.
 */
export const summaryRoot = cva('flex flex-col gap-2 text-sm text-foreground')

/** A group's summary block: combinator caption above its child chips. */
export const summaryGroup = cva(
  'flex flex-col gap-2 rounded-md border border-border p-2',
  {
    variants: {
      root: { true: 'bg-card', false: 'bg-muted/40' },
    },
    defaultVariants: { root: true },
  },
)

/** The "AND of N conditions" / "OR of N conditions" caption for a group. */
export const summaryCombinator = cva(
  'text-xs font-semibold tracking-wide text-muted-foreground uppercase',
)

/** Row holding a group's child chips and nested group blocks. */
export const summaryChildren = cva('flex flex-wrap items-start gap-2')

/**
 * One read-only rule chip. `min-w-0` lets the chip shrink below its content's
 * intrinsic width inside the flex row (without it a long unbreakable token forces
 * horizontal overflow); `break-words` keeps ordinary long text legible by
 * wrapping instead of clipping or scrolling.
 */
export const summaryChip = cva(
  'inline-flex min-w-0 max-w-full items-baseline gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs break-words text-foreground',
)

/** The field name part of a chip, given slightly more weight than the rest. */
export const summaryChipField = cva('font-medium text-foreground')

/** The operator verb part of a chip. */
export const summaryChipOperator = cva('text-muted-foreground')

/**
 * The value part of a chip. `min-w-0` + `wrap-anywhere` (`overflow-wrap:anywhere`)
 * force a break inside an unbroken run — a URL, hash or id with no spaces — so it
 * wraps within the chip rather than pushing the compact summary into a horizontal
 * scroll. Unlike `break-words`, `anywhere` also reduces the element's min-content
 * width, which is what actually lets the flex chip shrink.
 */
export const summaryChipValue = cva('min-w-0 wrap-anywhere font-medium text-foreground')
