import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import type { RenderRuleContext } from './FilterRule'
import { makeFilterTree } from './demo/fixtures'
import { deserialize, serialize } from './serialization'
import * as styles from './styles'
import type { FilterSchema, FilterTree } from './types'

// Счётчик рендеров по правилу (ключ — rule.field). Инструментированный renderRule
// ниже зовётся синхронно внутри рендера каждого FilterRule, так что число вызовов —
// ровно число рендеров этой строки. Не перерисованное правило не перезовёт
// renderRule — так же наблюдается стабильность update/remove: счётчик нетронутой
// строки не растёт.
const renders = new Map<string, number>()

// Стабильный renderRule уровня модуля. Его нельзя пересоздавать каждый рендер:
// FilterBuilder мемоизирует effectiveRenderRule на [renderRule, fields], и свежая
// функция инвалидировала бы memo, убив измеряемую тестом изоляцию.
function countingRenderRule(ctx: RenderRuleContext<FilterSchema>): ReactNode {
  const field = ctx.rule.field
  renders.set(field, (renders.get(field) ?? 0) + 1)
  return (
    <input
      aria-label={field}
      value={String(ctx.rule.value ?? '')}
      onChange={(event) => ctx.update({ value: event.target.value })}
    />
  )
}

// Stateful-хост, владеющий деревом и протягивающий стабильный renderRule.
function Host({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <FilterBuilder value={value} onChange={setValue} renderRule={countingRenderRule} />
  )
}

function snapshot(): Map<string, number> {
  return new Map(renders)
}

beforeEach(() => {
  renders.clear()
})

describe('FilterBuilder re-render isolation', () => {
  it('re-renders only the edited rule in a flat group (case A)', () => {
    const flat: FilterTree = {
      combinator: 'and',
      rules: Array.from({ length: 6 }, (_, index) => ({
        field: `r${index}`,
        operator: 'eq',
        value: '',
      })),
    }
    render(<Host initial={flat} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('r3'), { target: { value: 'x' } })

    // Правленая строка перерисовалась ровно на один раз больше…
    expect(renders.get('r3')).toBe((before.get('r3') ?? 0) + 1)
    // …а у каждого сиблинга счётчик тот же (структурный шаринг + memo + стабильный
    // ROOT_PATH держат их path/rule/actions ===).
    for (const field of ['r0', 'r1', 'r2', 'r4', 'r5']) {
      expect(renders.get(field)).toBe(before.get(field))
    }
  })

  it('does not re-render a sibling branch when editing a nested rule (case B)', () => {
    const nested: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'a0', operator: 'eq', value: '' },
        {
          combinator: 'or',
          rules: [
            { field: 'b0', operator: 'eq', value: '' },
            { field: 'b1', operator: 'eq', value: '' },
          ],
        },
      ],
    }
    render(<Host initial={nested} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('b0'), { target: { value: 'y' } })

    // Перерисовывается только правленый лист; сиблинг в той же группе и правило в
    // соседней ветке остаются на месте.
    expect(renders.get('b0')).toBe((before.get('b0') ?? 0) + 1)
    expect(renders.get('b1')).toBe(before.get('b1'))
    expect(renders.get('a0')).toBe(before.get('a0'))
  })

  it('keeps a deep edit from cascading sideways across the tree', () => {
    // Правило на три группы вглубь, с сиблинг-правилами и сиблинг-поддеревьями на
    // каждом уровне выше, чтобы любой каскад вширь всплыл лишним рендером на одном из них.
    const deep: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'top-sibling', operator: 'eq', value: '' },
        {
          combinator: 'or',
          rules: [
            { field: 'mid-sibling', operator: 'eq', value: '' },
            {
              combinator: 'and',
              rules: [
                { field: 'inner-sibling', operator: 'eq', value: '' },
                {
                  combinator: 'or',
                  rules: [
                    { field: 'deep-target', operator: 'eq', value: '' },
                    { field: 'deep-neighbour', operator: 'eq', value: '' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    render(<Host initial={deep} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('deep-target'), {
      target: { value: 'z' },
    })

    // Правленый лист перерисовывается один раз…
    expect(renders.get('deep-target')).toBe(
      (before.get('deep-target') ?? 0) + 1,
    )
    // …и ничего рядом — ни его сосед, ни сиблинг-правило на более мелком уровне —
    // не перерисовывается.
    for (const field of [
      'deep-neighbour',
      'inner-sibling',
      'mid-sibling',
      'top-sibling',
    ]) {
      expect(renders.get(field)).toBe(before.get(field))
    }
  })
})

// Счётчик рендеров на уровне групп. FilterGroup не принимает кастомный рендерер,
// поэтому его рендеры наблюдаем косвенно: рендер группы перезапускает рендереры
// детей, а группа с нетронутым поддеревом не должна перерисовать ни один свой лист.
// Разные префиксы у правил каждой группы позволяют отличить правку одной группы от
// активности соседней.
describe('FilterBuilder sibling-group isolation', () => {
  it('leaves a sibling group untouched when a rule in another group changes', () => {
    const twoGroups: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'or',
          rules: [
            { field: 'groupA-first', operator: 'eq', value: '' },
            { field: 'groupA-second', operator: 'eq', value: '' },
          ],
        },
        {
          combinator: 'or',
          rules: [
            { field: 'groupB-first', operator: 'eq', value: '' },
            { field: 'groupB-second', operator: 'eq', value: '' },
          ],
        },
      ],
    }
    render(<Host initial={twoGroups} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('groupA-first'), {
      target: { value: 'q' },
    })

    // Правленое правило в группе A перерисовывается один раз.
    expect(renders.get('groupA-first')).toBe(
      (before.get('groupA-first') ?? 0) + 1,
    )
    // У всех правил соседней группы B счётчик не растёт — B не перерисовывается,
    // так что всё её поддерево пропущено.
    expect(renders.get('groupB-first')).toBe(before.get('groupB-first'))
    expect(renders.get('groupB-second')).toBe(before.get('groupB-second'))
    // Нетронутое правило самой группы A тоже пропущено.
    expect(renders.get('groupA-second')).toBe(before.get('groupA-second'))
  })
})

// Прямой счётчик рендеров группы. groupPanel (cva-блок) зовётся ровно раз на рендер
// FilterGroup и больше нигде — summary использует summaryGroup, не groupPanel —
// поэтому шпион по нему точно считает рендеры FilterGroup. В отличие от пер-лист
// счётчика выше (который memo FilterRule держит плоским даже при рендере
// группы-предка, так что снятие memo С ГРУППЫ его не краснит), этот делает
// React.memo на FilterGroup load-bearing: без него соседняя группа перерисуется, и
// тут всплывёт лишний вызов groupPanel.
describe('FilterBuilder group-level render isolation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('re-renders only the root and the edited group, not a sibling group', () => {
    const groupPanelSpy = vi.spyOn(styles, 'groupPanel')

    // Корень (AND) с двумя вложенными OR-группами A и B, по два правила. Всего три
    // группы, поэтому протёкший рендер соседа виден третьим вызовом.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'or',
          rules: [
            { field: 'A-first', operator: 'eq', value: '' },
            { field: 'A-second', operator: 'eq', value: '' },
          ],
        },
        {
          combinator: 'or',
          rules: [
            { field: 'B-first', operator: 'eq', value: '' },
            { field: 'B-second', operator: 'eq', value: '' },
          ],
        },
      ],
    }
    render(<Host initial={tree} />)

    // Игнорируем рендеры при маунте; меряем только правку.
    groupPanelSpy.mockClear()

    // Правим правило в группе A. Структурный шаринг перезаписывает только корень и
    // группу A; B хранит identity, её мемоизированное поддерево пропущено.
    fireEvent.change(screen.getByLabelText('A-first'), {
      target: { value: 'x' },
    })

    // Ровно два рендера групп: корень + группа A. B изолирована memo. Disproof:
    // снять memo() с FilterGroup — B тоже перерисуется, станет 3 и упадёт «expected 3 to be 2».
    expect(groupPanelSpy).toHaveBeenCalledTimes(2)
  })
})

// Считает, сколько раз рендерится группа на помеченном пути. Инструментированный
// renderRule видит только листья, поэтому чтобы наблюдать рендер ГРУППЫ-ПРЕДКА,
// протягиваем пер-групповой тоггл combinator: смена комбинатора заставляет группу
// (и только группы вдоль её пути) выдать новый rules/combinator. Предки
// перерисовываются; соседние группы — нет.
describe('FilterBuilder ancestor re-render along the edited path', () => {
  it('re-renders the edited rule while its stable siblings stay flat', () => {
    // Изоляция про СИБЛИНГОВ, не про предков. Цепочка групп от корня до правленого
    // правила законно перерисовывается — они владеют изменившимся массивом rules. Но
    // мемоизированный лист ВНУТРИ перерисованной группы-предка всё равно
    // short-circuit'ит при неизменных пропах, так что сиблинг-строки не
    // перерисовываются. Утверждаем ровно эту границу: тест не запрещает рендер
    // предка и не терпит протечку в сиблинг.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'or',
          rules: [
            { field: 'same-group-sibling', operator: 'eq', value: '' },
            { field: 'edited', operator: 'eq', value: '' },
          ],
        },
        {
          combinator: 'or',
          rules: [{ field: 'off-path', operator: 'eq', value: '' }],
        },
      ],
    }
    render(<Host initial={tree} />)
    const before = snapshot()

    fireEvent.change(screen.getByLabelText('edited'), { target: { value: 'v' } })

    // Правленое правило перерисовывается ровно на один раз больше.
    expect(renders.get('edited')).toBe((before.get('edited') ?? 0) + 1)
    // Сиблинг в ТОЙ ЖЕ группе-предке всё равно пропущен: его rule-объект, path и
    // колбэки — ===, поэтому React.memo отскакивает, хоть родительская группа и
    // перерисовалась. Это более жёсткая гарантия — рендер предка не форсит его
    // мемоизированных детей.
    expect(renders.get('same-group-sibling')).toBe(
      before.get('same-group-sibling'),
    )
    // Ветка вне пути, с корнем в соседней группе, пропущена целиком.
    expect(renders.get('off-path')).toBe(before.get('off-path'))
  })

  it('re-renders the whole path when a group along it structurally changes', () => {
    // Смена комбинатора вложенной группы заменяет её и все группы выше (структурный
    // шаринг переписывает путь). React перерисовывает эти группы; но childPaths
    // ремапится, только когда меняется rules.length, а смена комбинатора держит
    // пути детей стабильными — так что сами правила не перерисовываются. Рендер
    // ограничен группами на пути, что подтверждаем плоским счётчиком ветки вне пути.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        {
          combinator: 'and',
          rules: [{ field: 'nested-rule', operator: 'eq', value: '' }],
        },
        {
          combinator: 'or',
          rules: [{ field: 'other-branch', operator: 'eq', value: '' }],
        },
      ],
    }
    render(<Host initial={tree} />)
    const before = snapshot()

    // Переключаем комбинатор первой вложенной группы с AND на OR. Тогглов два
    // (корень + вложенный); целимся в OR-кнопку вложенной группы.
    const orButtons = screen.getAllByRole('button', { name: 'OR' })
    // Корневой OR — первый; OR-кнопка вложенной группы — вторая.
    fireEvent.click(orButtons[orButtons.length - 1]!)

    // Правило внутри перевёрнутой группы держит стабильные пропы (его объект, path и
    // колбэки не тронуты), так что даже рендер его группы не форсит его перерисовку.
    expect(renders.get('nested-rule')).toBe(before.get('nested-rule'))
    // Соседняя ветка целиком вне пути и не перерисовывается.
    expect(renders.get('other-branch')).toBe(before.get('other-branch'))
  })
})

describe('FilterBuilder callback stability', () => {
  it('does not re-invoke an untouched rule renderer when a distant rule changes', () => {
    // renderRule зовётся раз на рендер строки и замыкается на ctx.update/ctx.remove.
    // Если бы эти колбэки пересобирались на каждое изменение дерева, memo нетронутой
    // строки сломалось бы и её рендерер сработал снова. Плоский счётчик нетронутой
    // строки — наблюдаемое доказательство, что колбэки остаются === сквозь чужую правку.
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        { field: 'untouched', operator: 'eq', value: '' },
        { field: 'target', operator: 'eq', value: '' },
      ],
    }
    render(<Host initial={tree} />)
    const untouchedRendersBefore = renders.get('untouched')

    // Две независимые правки другой строки; нетронутая не должна перерисоваться ни на одну.
    fireEvent.change(screen.getByLabelText('target'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('target'), { target: { value: '2' } })

    expect(renders.get('untouched')).toBe(untouchedRendersBefore)
    // Проверка: правленая строка реально перерисовалась — тест зелёный не потому,
    // что ничего не произошло.
    expect(renders.get('target')).toBeGreaterThan(1)
  })
})

// Перцентильный хелпер: прогреваем JIT, затем берём медиану повторных замеров, чтобы
// одиночный GC/JIT-спайк не завалил бюджет. JSON.stringify/parse — O(n), так что
// медиана ложится сильно под бюджет.
function medianMs(run: () => void, { warmup = 5, measure = 10 } = {}): number {
  for (let i = 0; i < warmup; i += 1) run()
  const samples: number[] = []
  for (let i = 0; i < measure; i += 1) {
    const start = performance.now()
    run()
    samples.push(performance.now() - start)
  }
  samples.sort((a, b) => a - b)
  return samples[Math.floor(samples.length / 2)]!
}

const SERIALIZE_BUDGET_MS = 5

describe('FilterBuilder serialize budget (200 rules / 20 groups)', () => {
  const tree = makeFilterTree(200, 10)
  const wire = serialize(tree)

  it('serializes 200 rules within budget', () => {
    const median = medianMs(() => {
      serialize(tree)
    })
    console.log(`serialize(200) median: ${median.toFixed(4)} ms`)
    // Под бюджетом, но строго выше нуля: no-op serialize замерил бы ~0 и протащил бы
    // сломанную реализацию сквозь односторонний бюджет-чек.
    expect(median).toBeGreaterThan(0)
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('deserializes 200 rules within budget', () => {
    const median = medianMs(() => {
      deserialize(wire)
    })
    console.log(`deserialize(200) median: ${median.toFixed(4)} ms`)
    expect(median).toBeGreaterThan(0)
    expect(median).toBeLessThanOrEqual(SERIALIZE_BUDGET_MS)
  })

  it('round-trips a 200-rule tree without wire-format regression', () => {
    expect(deserialize(serialize(tree))).toEqual(tree)
  })
})
