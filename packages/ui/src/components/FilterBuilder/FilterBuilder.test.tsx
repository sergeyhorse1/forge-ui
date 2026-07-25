import '@testing-library/jest-dom/vitest'

import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import {
  addGroup,
  addRule,
  removeNode,
  setCombinator,
  updateRule,
} from './tree'
import type { FilterRule, FilterTree } from './types'

// Пустое правило, добавляемое FilterBuilder без createRule.
const DEFAULT_RULE: FilterRule = { field: '', operator: '', value: '' }

function makeRule(field: string): FilterRule {
  return { field, operator: 'eq', value: field }
}

// Корень: одно правило, вложенная группа (с одним правилом), замыкающее правило.
function makeNestedTree(): FilterTree {
  const nestedRule: FilterRule = {
    field: 'nestedField',
    operator: 'eq',
    value: 'nestedValue',
  }
  return {
    combinator: 'and',
    rules: [
      makeRule('a'),
      { combinator: 'or', rules: [nestedRule] },
      makeRule('b'),
    ],
  }
}

// Кнопка комбинатора, видимая метка AND/OR.
function combinatorButton(scope: HTMLElement, label: 'AND' | 'OR') {
  return within(scope).getByRole('button', { name: label })
}

describe('FilterBuilder — controlled onChange correctness', () => {
  it('Add rule at root emits addRule(value, [], defaultRule)', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [], DEFAULT_RULE))
  })

  it('Add group at root emits addGroup(value, [])', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addGroup(value, []))
  })

  it('Remove rule emits removeNode(value, [0])', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [0]))
  })

  it('uses a consumer-supplied createRule for Add rule', () => {
    const value: FilterTree = { combinator: 'and', rules: [] }
    const onChange = vi.fn()
    const custom = makeRule('seed')
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        createRule={() => custom}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    expect(onChange).toHaveBeenCalledWith(addRule(value, [], custom))
  })
})

describe('FilterBuilder — fully controlled, no internal tree state', () => {
  // Load-bearing disproof: onChange глотает апдейт, поэтому value не меняется. Если
  // кто-то зеркалит дерево в useState/useReducer, клик оптимистично добавит строку и
  // ассерт покраснеет. Зелёным он остаётся, только пока компонент — чистая проекция
  // пропа value.
  it('does not optimistically add a rule when onChange is ignored', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn() // намеренно глотает следующее дерево
    render(<FilterBuilder value={value} onChange={onChange} />)

    const before = screen.getAllByLabelText('Field').length
    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    const after = screen.getAllByLabelText('Field').length

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(after).toBe(before)
  })
})

describe('FilterBuilder — recursion path correctness', () => {
  it('Add rule inside the nested group hits path [1]', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    // Вложенная группа — единственная с активным OR-тогглом; берём её role-group
    // комбинатора как якорь, чтобы дойти до её же «Add rule».
    const allGroups = screen.getAllByRole('group', { name: 'Match type' })
    const nestedToggle = allGroups.find(
      (g) =>
        within(g).getByRole('button', { name: 'OR' }).getAttribute('aria-pressed') ===
        'true',
    )!
    // Путь наверх от тоггла: groupHeader, затем groupPanel
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [1], DEFAULT_RULE))
  })

  it('Remove nested group emits removeNode(value, [1])', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove group' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1]))
  })

  it('Add group inside the nested group hits path [1] (>= 2 levels deep)', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const allGroups = screen.getAllByRole('group', { name: 'Match type' })
    const nestedToggle = allGroups.find(
      (g) =>
        within(g).getByRole('button', { name: 'OR' }).getAttribute('aria-pressed') ===
        'true',
    )!
    // Путь наверх от тоггла: groupHeader, затем groupPanel
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add group' })[0]!,
    )

    expect(onChange).toHaveBeenCalledWith(addGroup(value, [1]))
  })
})

describe('FilterBuilder — updateRule wiring', () => {
  it('typing into a value input emits updateRule at the right path', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Value'), {
      target: { value: 'next' },
    })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [0], { value: 'next' }),
    )
  })

  it('typing into a nested rule field emits updateRule at [1, 0]', () => {
    const value = makeNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const nestedField = screen.getByDisplayValue('nestedField')
    fireEvent.change(nestedField, { target: { value: 'changed' } })

    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [1, 0], { field: 'changed' }),
    )
  })
})

describe('FilterBuilder — combinator toggle', () => {
  it('clicking the inactive combinator emits setCombinator(value, [], other)', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const rootToggle = screen.getAllByRole('group', { name: 'Match type' })[0]!
    expect(combinatorButton(rootToggle, 'AND')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(combinatorButton(rootToggle, 'OR'))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(setCombinator(value, [], 'or'))
  })
})

describe('FilterBuilder — renderRule seam', () => {
  it('renders custom controls and wires update/remove through actions', () => {
    const value: FilterTree = { combinator: 'and', rules: [makeRule('a')] }
    const onChange = vi.fn()
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        renderRule={({ rule, update, remove }) => (
          <div>
            <span>custom:{rule.field}</span>
            <button type="button" onClick={() => update({ field: 'z' })}>
              patch
            </button>
            <button type="button" onClick={remove}>
              drop
            </button>
          </div>
        )}
      />,
    )

    expect(screen.getByText('custom:a')).toBeInTheDocument()
    // При заданном renderRule дефолтного нативного редактора быть не должно.
    expect(screen.queryByLabelText('Field')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'patch' }))
    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [0], { field: 'z' }),
    )
  })

  it('wires the custom remove button through removeNode at the rule path', () => {
    const value: FilterTree = {
      combinator: 'and',
      rules: [makeRule('a'), makeRule('b'), makeRule('c')],
    }
    const onChange = vi.fn()
    render(
      <FilterBuilder
        value={value}
        onChange={onChange}
        renderRule={({ rule, remove }) => (
          <button type="button" onClick={remove}>
            drop {rule.field}
          </button>
        )}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'drop b' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1]))
  })
})

// Плоская группа из трёх разных правил. Разные field-метки дают тесту нацелиться на
// конкретную строку, чтобы удаление среднего отличалось от первого/последнего.
function makeSiblingTree(): FilterTree {
  return {
    combinator: 'and',
    rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
  }
}

// Рендерит каждое правило с помеченной кнопкой удаления, чтобы тест мог назвать
// конкретную строку: кнопки несут field правила, так что `drop <field>` однозначен.
function withNamedRemovers(
  value: FilterTree,
  onChange: (next: FilterTree) => void,
) {
  return render(
    <FilterBuilder
      value={value}
      onChange={onChange}
      renderRule={({ rule, update, remove }) => (
        <div>
          <span>row:{String(rule.field)}</span>
          <button type="button" onClick={() => update({ value: 'edited' })}>
            edit {String(rule.field)}
          </button>
          <button type="button" onClick={remove}>
            drop {String(rule.field)}
          </button>
        </div>
      )}
    />,
  )
}

describe('FilterBuilder — sibling index correctness', () => {
  it('removing the first of several rules targets index 0', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop alpha' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [0]))
  })

  it('removing the middle of several rules targets index 1, not the last', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop beta' }))

    const emitted = removeNode(value, [1])
    expect(onChange).toHaveBeenCalledWith(emitted)
    // Удаление среднего должно сохранить крайних сиблингов, по порядку.
    expect(emitted.rules.map((r) => (r as FilterRule).field)).toEqual([
      'alpha',
      'gamma',
    ])
  })

  it('removing the last of several rules targets the final index', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'drop gamma' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [2]))
  })

  it('editing the middle rule patches index 1 and leaves siblings untouched', () => {
    const value = makeSiblingTree()
    const onChange = vi.fn()
    withNamedRemovers(value, onChange)

    fireEvent.click(screen.getByRole('button', { name: 'edit beta' }))

    const emitted = updateRule(value, [1], { value: 'edited' })
    expect(onChange).toHaveBeenCalledWith(emitted)
    expect((emitted.rules[1] as FilterRule).value).toBe('edited')
    // Нетронутые сиблинги сохраняют object identity.
    expect(emitted.rules[0]).toBe(value.rules[0])
    expect(emitted.rules[2]).toBe(value.rules[2])
  })
})

// Корень с ведущим правилом и вложенной группой, содержащей ещё более глубокую.
// Самая глубокая группа — на пути [1, 1], её правило — на [1, 1, 0]. Позволяет
// тесту доказать, что путь протягивается на три уровня, а не на один.
function makeDeeplyNestedTree(): FilterTree {
  return {
    combinator: 'and',
    rules: [
      makeRule('top'),
      {
        combinator: 'or',
        rules: [
          makeRule('mid'),
          {
            combinator: 'and',
            rules: [{ field: 'deepField', operator: 'eq', value: 'deepValue' }],
          },
        ],
      },
    ],
  }
}

describe('FilterBuilder — deep recursion path threading', () => {
  // Самая глубокая группа даёт единственную кнопку «Remove group» на два уровня
  // внутрь; находим её, поднимаясь от field-инпута правила, которое только она держит.
  function deepestGroupPanel(): HTMLElement {
    const deepField = screen.getByDisplayValue('deepField')
    // input → ruleRow → обёртка data-rule-path → groupChildren → groupPanel
    return deepField.parentElement!.parentElement!.parentElement!.parentElement!
  }

  it('adds a rule into a group nested two levels deep at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    fireEvent.click(
      within(panel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(addRule(value, [1, 1], DEFAULT_RULE))
  })

  it('removes the deepest group at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    fireEvent.click(within(panel).getByRole('button', { name: 'Remove group' }))

    expect(onChange).toHaveBeenCalledWith(removeNode(value, [1, 1]))
  })

  it('edits the rule nested three levels deep at path [1, 1, 0]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    fireEvent.change(screen.getByDisplayValue('deepField'), {
      target: { value: 'deeper' },
    })

    expect(onChange).toHaveBeenCalledWith(
      updateRule(value, [1, 1, 0], { field: 'deeper' }),
    )
  })

  it('toggles the combinator of a group nested two levels deep at path [1, 1]', () => {
    const value = makeDeeplyNestedTree()
    const onChange = vi.fn()
    render(<FilterBuilder value={value} onChange={onChange} />)

    const panel = deepestGroupPanel()
    const toggle = within(panel).getByRole('group', { name: 'Match type' })
    expect(combinatorButton(toggle, 'AND')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(combinatorButton(toggle, 'OR'))

    expect(onChange).toHaveBeenCalledWith(setCombinator(value, [1, 1], 'or'))
  })
})

describe('FilterBuilder — sequential edits through a stateful host', () => {
  // Компонент читает value/onChange из ref'ов, обновляемых каждый рендер. Реальный
  // stateful-хост перерендеривается с новым деревом после каждой правки, поэтому два
  // add подряд должны накапливаться, а не второй перетирать первый.
  function Host({ initial }: { initial: FilterTree }) {
    const [value, setValue] = useState<FilterTree>(initial)
    return <FilterBuilder value={value} onChange={setValue} />
  }

  it('two consecutive Add rule clicks accumulate to three rows', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('seed')] }} />)

    expect(screen.getAllByLabelText('Field')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(screen.getAllByLabelText('Field')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    expect(screen.getAllByLabelText('Field')).toHaveLength(3)
  })

  it('editing one row then another keeps the first edit in the tree', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('first'), makeRule('second')],
        }}
      />,
    )

    const fields = () => screen.getAllByLabelText('Field') as HTMLInputElement[]
    fireEvent.change(fields()[0]!, { target: { value: 'one' } })
    fireEvent.change(fields()[1]!, { target: { value: 'two' } })

    expect(fields()[0]!.value).toBe('one')
    expect(fields()[1]!.value).toBe('two')
  })
})
