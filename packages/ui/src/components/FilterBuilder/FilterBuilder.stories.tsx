import { useMemo, useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { FilterBuilder } from './FilterBuilder'
import { FilterBuilderPerfHarness } from './demo/FilterBuilderPerfHarness'
import { makeFilterTree } from './demo/fixtures'
import type { FilterFieldSchema } from './schema'
import type { FilterTree } from './types'

// Хост стори: держит дерево в реальном state и возвращает через onChange —
// доказывает сквозной controlled-поток: панель обновляется только потому, что
// консьюмер даёт ей новый value, а не из внутреннего состояния.
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

// Stateful-хост, дополнительно протягивающий схему полей и форсированный mode.
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
  // Каждая стори ниже использует stateful render-хост со своими value/onChange,
  // так что эти args — заглушки, лишь удовлетворяющие обязательные пропы
  // типизированного meta; render их перекрывает.
  args: { value: SINGLE_RULE, onChange: () => {} },
} satisfies Meta<typeof FilterBuilder>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  tags: ['test'],
  render: () => <ControlledFilterBuilder initial={SINGLE_RULE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Настоящие <button>, не div.
    const addRule = canvas.getByRole('button', { name: 'Add rule' })
    await expect(addRule.tagName).toBe('BUTTON')

    // Match-type тоггл отражает состояние и переключается по клику.
    const toggle = canvas.getAllByRole('group', { name: 'Match type' })[0]!
    const and = within(toggle).getByRole('button', { name: 'AND' })
    const or = within(toggle).getByRole('button', { name: 'OR' })
    await expect(and).toHaveAttribute('aria-pressed', 'true')
    await expect(or).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(or)
    await expect(or).toHaveAttribute('aria-pressed', 'true')
    await expect(and).toHaveAttribute('aria-pressed', 'false')

    // Добавление правила увеличивает счётчик правил (сквозной controlled-поток).
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

    // Минимум два тоггла комбинатора значат, что вложенная группа отрисована:
    // корень плюс внутренняя OR-группа (≥2 уровня вглубь).
    const toggles = canvas.getAllByRole('group', { name: 'Match type' })
    await expect(toggles.length).toBeGreaterThanOrEqual(2)

    // Вложенная группа удаляема; корневая — нет.
    const removeGroup = canvas.getAllByRole('button', { name: 'Remove group' })
    await expect(removeGroup.length).toBe(1)

    // Добавляем правило во вложенную группу и проверяем рост её счётчика правил.
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

// Клавиатура и управление фокусом: добавление правила сажает фокус на первый
// контрол новой строки, удаление — на уцелевшего соседа (никогда на document.body),
// каждая панель группы — доступный role="group". Билдер полностью controlled без
// состояния дерева, поэтому фокус двигает пост-коммит эффект, когда консьюмер
// вернёт следующий value.
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

    // (3) Каждая панель группы — доступная group. Корень помечен и при единственной
    // плоской группе — единственная панель-группа.
    await expect(
      canvas.getByRole('group', { name: 'Filter rules' }),
    ).toBeInTheDocument()

    // (1) Добавление правила сажает фокус на первый контрол новой (третьей) строки.
    await userEvent.click(canvas.getByRole('button', { name: 'Add rule' }))
    const newRow = canvasElement.querySelector<HTMLElement>(
      '[data-rule-path="2"]',
    )
    await expect(newRow).not.toBeNull()
    await expect(newRow!.contains(doc.activeElement)).toBe(true)

    // (2) Удаление правила сажает фокус на уцелевшего соседа, не на body. Удаляем
    // среднее правило (индекс 1); фокус берёт его предыдущий сиблинг (индекс 0).
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

    // Селектор поля — настоящий <select>, наполненный из лейблов схемы.
    const fields = canvas.getAllByLabelText('Field') as HTMLSelectElement[]
    await expect(fields[0]!.tagName).toBe('SELECT')

    // Первое правило — строковое поле на contains; его <select> оператора должен
    // предлагать строковые операторы, а не числовой between.
    const operators = canvas.getAllByLabelText('Operator') as HTMLSelectElement[]
    const firstOptions = Array.from(operators[0]!.options, (o) => o.value)
    await expect(firstOptions).toContain('contains')
    await expect(firstOptions).not.toContain('between')

    // Переключение первого правила на числовое поле реконсилит оператор в валидный
    // числовой (строковый contains невалиден для чисел).
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

    // Compact-режим read-only: редактируемых контролов поля нет.
    await expect(canvas.queryByLabelText('Field')).toBeNull()

    // Подписи групп описывают комбинатор и число прямых детей.
    await expect(canvas.getByText('AND of 2 conditions')).toBeInTheDocument()
    await expect(canvas.getByText('OR of 2 conditions')).toBeInTheDocument()

    // Лейблы полей и глаголы операторов проступают как текст чипов.
    await expect(canvas.getByText('Name')).toBeInTheDocument()
    await expect(canvas.getByText('Price')).toBeInTheDocument()
    await expect(canvas.getByText('between')).toBeInTheDocument()
  },
}

// Режет computed box-shadow на отдельные слои теней, игнорируя запятые внутри
// rgb(...)/rgba(...) кортежей цвета.
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

// Активный сегмент комбинатора должен показывать видимый клавиатурный фокус-ринг.
// Его заливка — bg-primary, а общий --color-ring == --color-primary, поэтому на
// активном сегменте ринг override'ится на primary-foreground — иначе он покрасился
// бы в цвет собственной заливки и исчез.
export const ActiveSegmentFocusRing: Story = {
  tags: ['test'],
  render: () => <ControlledFilterBuilder initial={SINGLE_RULE} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const view = canvasElement.ownerDocument.defaultView!

    const toggle = canvas.getAllByRole('group', { name: 'Match type' })[0]!
    const and = within(toggle).getByRole('button', { name: 'AND' })
    // Override ринга применяется именно к активному сегменту.
    await expect(and).toHaveAttribute('aria-pressed', 'true')

    // Настоящий Tab садится на первый контрол (активный AND-сегмент). В отличие от
    // программного focus(), он удовлетворяет :focus-visible в Chromium, и ринг реально рисуется.
    await userEvent.tab()
    await expect(and).toHaveFocus()

    const style = view.getComputedStyle(and)
    // Ринг рисуется как box-shadow, так что он должен вообще присутствовать.
    await expect(style.boxShadow).not.toBe('none')

    // Ринг инсетный (внутри кнопки, чтобы overflow-hidden тоггла его не резал).
    // Вычленяем инсетный слой и читаем его цвет.
    const insetLayer = shadowLayers(style.boxShadow).find((layer) =>
      layer.includes('inset'),
    )
    await expect(insetLayer).toBeDefined()
    const ringColor = firstColor(insetLayer!)
    await expect(ringColor).toBeDefined()

    // Цвет ринга должен отличаться от собственной bg-primary заливки сегмента, иначе
    // клавиатурный индикатор фокуса был бы невидим на активном сегменте.
    await expect(ringColor).not.toBe(style.backgroundColor)
  },
}

// Длинное неразрывное значение (URL без пробелов) в узком compact-summary должно
// переноситься внутри чипа, а не толкать контейнер в горизонтальный скролл.
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

    // Проверка: длинный токен реально на экране как текст чипа.
    await expect(
      canvas.getByText(/token-abcdefghijklmnopqrstuvwxyz0123456789/),
    ).toBeInTheDocument()

    const shell = canvasElement.querySelector<HTMLElement>(
      '[data-testid="compact-shell"]',
    )!
    // Горизонтального переполнения нет: контент переносится внутри 360px shell, а не расширяет его.
    await expect(shell.scrollWidth).toBe(shell.clientWidth)
  },
}

// Строит тяжёлое дерево лениво в рендере, не на уровне модуля.
function PerfStory() {
  const initial = useMemo(() => makeFilterTree(200, 10), [])
  return <FilterBuilderPerfHarness initial={initial} />
}

// Ручной perf-стенд над деревом из 200 правил в ~20 вложенных группах. Намеренно НЕ
// помечен test: это измерительный инструмент (как стори DataGrid Perf100k), а бюджеты
// изоляции и сериализации уже доказаны jsdom perf-тестом. Кнопками пишем числа в
// window.__filterbuilderPerf.
export const Perf: Story = {
  render: () => <PerfStory />,
}
