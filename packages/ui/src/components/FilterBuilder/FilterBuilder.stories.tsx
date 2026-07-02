import { useMemo, useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { FilterBuilder } from './FilterBuilder'
import { FilterBuilderPerfHarness } from './demo/FilterBuilderPerfHarness'
import { makeFilterTree } from './demo/fixtures'
import type { FilterFieldSchema } from './schema'
import type { FilterTree } from './types'

/**
 * Story host: holds the tree in real state and feeds it back through `onChange`.
 * This proves the end-to-end controlled flow — the panel only ever updates
 * because the consumer hands it a new `value`, never from internal state.
 */
function ControlledFilterBuilder({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <div className="max-w-2xl">
      <FilterBuilder value={value} onChange={setValue} />
    </div>
  )
}

const SINGLE_RULE: FilterTree = {
  combinator: 'and',
  rules: [{ field: 'status', operator: 'eq', value: 'active' }],
}

const NESTED: FilterTree = {
  combinator: 'and',
  rules: [
    { field: 'country', operator: 'eq', value: 'DE' },
    {
      combinator: 'or',
      rules: [
        { field: 'plan', operator: 'eq', value: 'pro' },
        { field: 'plan', operator: 'eq', value: 'team' },
      ],
    },
  ],
}

const FIELDS: FilterFieldSchema = [
  { field: 'name', label: 'Name', type: 'string' },
  { field: 'price', label: 'Price', type: 'number' },
  { field: 'createdAt', label: 'Created', type: 'date' },
  { field: 'active', label: 'Active', type: 'boolean' },
  {
    field: 'plan',
    label: 'Plan',
    type: 'enum',
    options: [
      { label: 'Free', value: 'free' },
      { label: 'Pro', value: 'pro' },
      { label: 'Team', value: 'team' },
    ],
  },
]

const SCHEMA_TREE: FilterTree = {
  combinator: 'and',
  rules: [
    { field: 'name', operator: 'contains', value: 'acme' },
    {
      combinator: 'or',
      rules: [
        { field: 'price', operator: 'between', value: [100, 200] },
        { field: 'plan', operator: 'in', value: ['pro', 'team'] },
      ],
    },
  ],
}

/** Stateful host that also threads a field schema and a forced mode. */
function SchemaFilterBuilder({
  initial,
  mode,
}: {
  initial: FilterTree
  mode?: 'expanded' | 'compact' | 'auto'
}) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <div className="max-w-2xl">
      <FilterBuilder
        value={value}
        onChange={setValue}
        fields={FIELDS}
        mode={mode}
      />
    </div>
  )
}

const meta = {
  title: 'Data/FilterBuilder',
  component: FilterBuilder,
  parameters: { layout: 'padded' },
  // Every story below uses a stateful `render` host that supplies its own
  // value/onChange, so these args are placeholders only there to satisfy the
  // required props on the typed meta; they are overridden by `render`.
  args: { value: SINGLE_RULE, onChange: () => {} },
} satisfies Meta<typeof FilterBuilder>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  tags: ['test'],
  render: () => <ControlledFilterBuilder initial={SINGLE_RULE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Real <button>s, not divs.
    const addRule = canvas.getByRole('button', { name: 'Add rule' })
    await expect(addRule.tagName).toBe('BUTTON')

    // Match-type toggle reflects state and flips on click.
    const toggle = canvas.getAllByRole('group', { name: 'Match type' })[0]!
    const and = within(toggle).getByRole('button', { name: 'AND' })
    const or = within(toggle).getByRole('button', { name: 'OR' })
    await expect(and).toHaveAttribute('aria-pressed', 'true')
    await expect(or).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(or)
    await expect(or).toHaveAttribute('aria-pressed', 'true')
    await expect(and).toHaveAttribute('aria-pressed', 'false')

    // Adding a rule increases the rule count (end-to-end controlled flow).
    const before = canvas.getAllByLabelText('Field').length
    await userEvent.click(addRule)
    const after = canvas.getAllByLabelText('Field').length
    await expect(after).toBe(before + 1)
  },
}

export const NestedGroups: Story = {
  tags: ['test'],
  render: () => <ControlledFilterBuilder initial={NESTED} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // At least two combinator toggles means a nested group is rendered: the
    // root plus the inner OR group (>= 2 levels deep).
    const toggles = canvas.getAllByRole('group', { name: 'Match type' })
    await expect(toggles.length).toBeGreaterThanOrEqual(2)

    // The nested group is removable; the root group is not.
    const removeGroup = canvas.getAllByRole('button', { name: 'Remove group' })
    await expect(removeGroup.length).toBe(1)

    // Add a rule into the nested group, then assert its rule count grew.
    const nestedToggle = toggles.find(
      (group) =>
        within(group)
          .getByRole('button', { name: 'OR' })
          .getAttribute('aria-pressed') === 'true',
    )!
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    const before = within(nestedPanel).getAllByLabelText('Field').length
    await userEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )
    const after = within(nestedPanel).getAllByLabelText('Field').length
    await expect(after).toBe(before + 1)
  },
}

/**
 * Keyboard and focus management: adding a rule moves focus into the new row's
 * first control, removing a rule moves focus to a surviving neighbour (never the
 * document body), and every group panel is an accessible `role="group"`. Because
 * the builder is fully controlled and holds no tree state, focus is moved by a
 * post-commit effect once the consumer echoes the next `value` back.
 */
export const KeyboardAndFocus: Story = {
  tags: ['test'],
  render: () => (
    <ControlledFilterBuilder
      initial={{
        combinator: 'and',
        rules: [
          { field: 'status', operator: 'eq', value: 'active' },
          { field: 'plan', operator: 'eq', value: 'pro' },
        ],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const doc = canvasElement.ownerDocument

    // (3) Every group panel is an accessible group. The root is labelled and,
    // with a single flat group, is the only panel-level group present.
    await expect(
      canvas.getByRole('group', { name: 'Filter rules' }),
    ).toBeInTheDocument()

    // (1) Adding a rule moves focus into the new (third) row's first control.
    await userEvent.click(canvas.getByRole('button', { name: 'Add rule' }))
    const newRow = canvasElement.querySelector<HTMLElement>(
      '[data-rule-path="2"]',
    )
    await expect(newRow).not.toBeNull()
    await expect(newRow!.contains(doc.activeElement)).toBe(true)

    // (2) Removing a rule moves focus to a surviving neighbour, not the body.
    // Remove the middle rule (index 1); its previous sibling (index 0) takes
    // focus.
    const removeButtons = canvas.getAllByRole('button', { name: 'Remove rule' })
    await userEvent.click(removeButtons[1]!)
    const survivor = canvasElement.querySelector<HTMLElement>(
      '[data-rule-path="0"]',
    )
    await expect(survivor).not.toBeNull()
    await expect(survivor!.contains(doc.activeElement)).toBe(true)
    await expect(doc.activeElement).not.toBe(doc.body)
  },
}

export const CustomRuleRenderer: Story = {
  render: function CustomRenderer() {
    const [value, setValue] = useState<FilterTree>(SINGLE_RULE)
    return (
      <div className="max-w-2xl">
        <FilterBuilder
          value={value}
          onChange={setValue}
          renderRule={({ rule, update, remove, idBase }) => (
            <div className="flex items-center gap-2 rounded-md border border-border bg-card p-2">
              <label className="sr-only" htmlFor={`${idBase}-custom`}>
                Condition
              </label>
              <input
                id={`${idBase}-custom`}
                className="h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                value={String(rule.value ?? '')}
                onChange={(event) => update({ value: event.target.value })}
              />
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                onClick={remove}
              >
                Remove
              </button>
            </div>
          )}
        />
      </div>
    )
  },
}

export const SchemaDriven: Story = {
  tags: ['test'],
  render: () => <SchemaFilterBuilder initial={SCHEMA_TREE} mode="expanded" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The field selector is a real <select> populated from the schema labels.
    const fields = canvas.getAllByLabelText('Field') as HTMLSelectElement[]
    await expect(fields[0]!.tagName).toBe('SELECT')

    // The first rule is a string field on "contains"; its operator <select>
    // must offer string operators and not, say, a numeric "between".
    const operators = canvas.getAllByLabelText('Operator') as HTMLSelectElement[]
    const firstOptions = Array.from(operators[0]!.options, (o) => o.value)
    await expect(firstOptions).toContain('contains')
    await expect(firstOptions).not.toContain('between')

    // Switching the first rule to the number field reconciles the operator to a
    // valid numeric one (string "contains" is invalid for numbers).
    await userEvent.selectOptions(fields[0]!, 'price')
    const afterOperators = canvas.getAllByLabelText(
      'Operator',
    ) as HTMLSelectElement[]
    const numericOptions = Array.from(afterOperators[0]!.options, (o) => o.value)
    await expect(numericOptions).toContain('eq')
    await expect(numericOptions).not.toContain('contains')
    await expect(afterOperators[0]!.value).not.toBe('contains')
  },
}

export const CompactSummary: Story = {
  tags: ['test'],
  render: () => <SchemaFilterBuilder initial={SCHEMA_TREE} mode="compact" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Compact mode is read-only: no editable field controls are present.
    await expect(canvas.queryByLabelText('Field')).toBeNull()

    // Group captions describe the combinator and its direct child count.
    await expect(canvas.getByText('AND of 2 conditions')).toBeInTheDocument()
    await expect(canvas.getByText('OR of 2 conditions')).toBeInTheDocument()

    // Field labels and operator verbs surface as chip text.
    await expect(canvas.getByText('Name')).toBeInTheDocument()
    await expect(canvas.getByText('Price')).toBeInTheDocument()
    await expect(canvas.getByText('between')).toBeInTheDocument()
  },
}

/** Splits a computed `box-shadow` into its individual shadow layers, ignoring the
 * commas that sit inside `rgb(...)` / `rgba(...)` colour tuples. */
function shadowLayers(boxShadow: string): string[] {
  return boxShadow.split(/,(?![^(]*\))/).map((layer) => layer.trim())
}

function firstColor(layer: string): string | undefined {
  return layer.match(
    /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[0-9a-fA-F]+/,
  )?.[0]
}

const COMPACT_LONG_VALUE: FilterTree = {
  combinator: 'and',
  rules: [
    {
      field: 'name',
      operator: 'contains',
      value:
        'https://example.com/very/long/unbreakable/token-abcdefghijklmnopqrstuvwxyz0123456789',
    },
  ],
}

/**
 * The active combinator segment must show a visible keyboard focus ring. Its fill
 * is `bg-primary`, and the shared `--color-ring` equals `--color-primary`, so the
 * ring is overridden to `primary-foreground` on the active segment — otherwise it
 * would paint the same colour as its own fill and vanish.
 */
export const ActiveSegmentFocusRing: Story = {
  tags: ['test'],
  render: () => <ControlledFilterBuilder initial={SINGLE_RULE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!

    const toggle = canvas.getAllByRole('group', { name: 'Match type' })[0]!
    const and = within(toggle).getByRole('button', { name: 'AND' })
    // The active segment is the one the ring override applies to.
    await expect(and).toHaveAttribute('aria-pressed', 'true')

    // A real Tab press lands on the first control (the active AND segment). Unlike
    // a programmatic focus(), it satisfies :focus-visible in Chromium, so the ring
    // actually paints.
    await userEvent.tab()
    await expect(and).toHaveFocus()

    const style = view.getComputedStyle(and)
    // The ring is painted as a box-shadow, so it must be present at all.
    await expect(style.boxShadow).not.toBe('none')

    // The ring is inset (kept inside the button so the toggle's overflow-hidden
    // does not clip it). Isolate that inset layer and read its colour.
    const insetLayer = shadowLayers(style.boxShadow).find((layer) =>
      layer.includes('inset'),
    )
    await expect(insetLayer).toBeDefined()
    const ringColor = firstColor(insetLayer!)
    await expect(ringColor).toBeDefined()

    // The ring colour must differ from the segment's own bg-primary fill, or the
    // keyboard focus indicator would be invisible on the active segment.
    await expect(ringColor).not.toBe(style.backgroundColor)
  },
}

/**
 * A long unbreakable value (a URL with no spaces) in a narrow compact summary must
 * wrap inside its chip rather than push the container into a horizontal scroll.
 */
export const CompactChipOverflow: Story = {
  tags: ['test'],
  render: () => {
    const [value, setValue] = useState<FilterTree>(COMPACT_LONG_VALUE)
    return (
      <div data-testid="compact-shell" style={{ width: 360 }}>
        <FilterBuilder
          value={value}
          onChange={setValue}
          fields={FIELDS}
          mode="compact"
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Sanity: the long token really is on screen as chip text.
    await expect(
      canvas.getByText(/token-abcdefghijklmnopqrstuvwxyz0123456789/),
    ).toBeInTheDocument()

    const shell = canvasElement.querySelector<HTMLElement>(
      '[data-testid="compact-shell"]',
    )!
    // No horizontal overflow: the content wraps within the 360px shell instead of
    // widening it.
    await expect(shell.scrollWidth).toBe(shell.clientWidth)
  },
}

/** Lazily builds the heavy tree in render, never at module scope. */
function PerfStory() {
  const initial = useMemo(() => makeFilterTree(200, 10), [])
  return <FilterBuilderPerfHarness initial={initial} />
}

/**
 * Manual perf harness over a 200-rule tree spread across ~20 nested groups. It
 * is deliberately **not** tagged `test`: it is a measurement tool (like the
 * DataGrid `Perf100k` story), and the isolation and serialize budgets are already
 * proven by the jsdom perf test. Use the buttons to record numbers into
 * `window.__filterbuilderPerf`.
 */
export const Perf: Story = {
  render: () => <PerfStory />,
}
