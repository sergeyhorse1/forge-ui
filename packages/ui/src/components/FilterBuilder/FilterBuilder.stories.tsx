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

    // Combinator toggle reflects state and flips on click.
    const toggle = canvas.getAllByRole('group', { name: 'Combinator' })[0]!
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
    const toggles = canvas.getAllByRole('group', { name: 'Combinator' })
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
