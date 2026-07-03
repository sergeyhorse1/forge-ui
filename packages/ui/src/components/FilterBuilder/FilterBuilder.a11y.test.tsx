import '@testing-library/jest-dom/vitest'

import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { FilterBuilder } from './FilterBuilder'
import { encodePath } from './focus'
import type { FilterPath, FilterRule, FilterTree } from './types'

function makeRule(field: string): FilterRule {
  return { field, operator: 'eq', value: field }
}

// Stateful-хост как в реальном использовании: владеет деревом и эхо-возвращает
// каждую правку через value, чтобы пост-коммит фокус-эффект видел новый DOM.
// Управление фокусом работает, только когда консьюмер уважает onChange.
function Host({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return <FilterBuilder value={value} onChange={setValue} />
}

// Строка правила (внешний div с data-rule-path) для заданного пути.
function ruleRowAt(path: FilterPath): HTMLElement {
  const row = document.querySelector<HTMLElement>(
    `[data-rule-path="${encodePath(path)}"]`,
  )
  if (row === null) throw new Error(`no rule row at ${encodePath(path)}`)
  return row
}

describe('FilterBuilder — focus management on add', () => {
  it('moves focus into the new row after Add rule at root', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('a')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    // Добавленное правило на индексе 1; фокус должен сесть на его первый контрол.
    const newRow = ruleRowAt([1])
    const firstControl = within(newRow).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
  })

  it('moves focus into the new rule inside a nested group', () => {
    const tree: FilterTree = {
      combinator: 'and',
      rules: [
        makeRule('a'),
        { combinator: 'or', rules: [makeRule('nested')] },
      ],
    }
    render(<Host initial={tree} />)

    // Доходим до «Add rule» вложенной группы через её match-type тоггл
    // (единственная группа с нажатым OR-сегментом).
    const toggles = screen.getAllByRole('group', { name: 'Match type' })
    const nestedToggle = toggles.find(
      (group) =>
        within(group)
          .getByRole('button', { name: 'OR' })
          .getAttribute('aria-pressed') === 'true',
    )!
    const nestedPanel = nestedToggle.parentElement!.parentElement!
    fireEvent.click(
      within(nestedPanel).getAllByRole('button', { name: 'Add rule' })[0]!,
    )

    // Новое правило на [1, 1]; фокус получает его первый контрол.
    const newRow = ruleRowAt([1, 1])
    const firstControl = within(newRow).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
  })

  it('moves focus into the new group after Add group', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('a')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

    // Новая пустая группа на индексе 1; её первый фокусируемый — AND-сегмент
    // match-type тоггла.
    const newGroup = document.querySelector<HTMLElement>(
      `[data-group-path="${encodePath([1])}"]`,
    )!
    const firstControl = within(newGroup).getAllByRole('button')[0]!
    expect(document.activeElement).toBe(firstControl)
  })
})

describe('FilterBuilder — focus management on remove', () => {
  it('focuses the previous sibling after removing a non-first rule', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
        }}
      />,
    )

    // Удаляем среднее правило (индекс 1). Фокус должен взять его предыдущий сиблинг
    // (индекс 0, «alpha»), чтобы клавиатурного юзера не уронило на body.
    const removeButtons = screen.getAllByRole('button', { name: 'Remove rule' })
    fireEvent.click(removeButtons[1]!)

    const survivor = ruleRowAt([0])
    const firstControl = within(survivor).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
    // Проверка: field-инпут всё ещё показывает уцелевшее первое правило.
    expect((firstControl as HTMLInputElement).value).toBe('alpha')
  })

  it('focuses the slid-in neighbour after removing the first rule', () => {
    render(
      <Host
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta')],
        }}
      />,
    )

    const removeButtons = screen.getAllByRole('button', { name: 'Remove rule' })
    fireEvent.click(removeButtons[0]!)

    // «beta» съезжает на индекс 0; фокус следует за ней туда.
    const survivor = ruleRowAt([0])
    const firstControl = within(survivor).getAllByRole('textbox')[0]!
    expect(document.activeElement).toBe(firstControl)
    expect((firstControl as HTMLInputElement).value).toBe('beta')
  })

  it('focuses the Add rule button after removing the only rule in a group', () => {
    render(<Host initial={{ combinator: 'and', rules: [makeRule('solo')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove rule' }))

    // Корневая группа опустела: фокус откатывается на её кнопку Add rule.
    const addRule = screen.getByRole('button', { name: 'Add rule' })
    expect(document.activeElement).toBe(addRule)
  })

  it('leaves focus where the user left it when onChange is ignored', () => {
    // Read-only консьюмер глотает onChange — ре-рендера нет, пост-коммит резолвер не
    // запускается. Фокус должен остаться на контроле, с которым работал юзер:
    // резолвер не должен тянуться сквозь неизменившееся дерево и уводить его.
    render(
      <FilterBuilder
        value={{ combinator: 'and', rules: [makeRule('a'), makeRule('b')] }}
        onChange={() => {}}
      />,
    )

    const removeButton = screen.getAllByRole('button', {
      name: 'Remove rule',
    })[0]!
    removeButton.focus()
    fireEvent.click(removeButton)

    // Правка проглочена: обе строки на месте, фокус всё ещё на кнопке.
    expect(screen.getAllByLabelText('Field')).toHaveLength(2)
    expect(document.activeElement).toBe(removeButton)
  })
})

describe('FilterBuilder — group and toggle semantics', () => {
  it('exposes each group as an accessible group with a label', () => {
    render(
      <FilterBuilder
        value={{
          combinator: 'and',
          rules: [
            makeRule('a'),
            { combinator: 'or', rules: [makeRule('b')] },
          ],
        }}
        onChange={() => {}}
      />,
    )

    // Корневая группа помечена «Filter rules», вложенная — «Rule group».
    expect(
      screen.getByRole('group', { name: 'Filter rules' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Rule group' })).toBeInTheDocument()
  })

  it('labels the AND/OR toggle "Match type", not jargon', () => {
    render(
      <FilterBuilder
        value={{ combinator: 'and', rules: [makeRule('a')] }}
        onChange={() => {}}
      />,
    )

    const toggle = screen.getByRole('group', { name: 'Match type' })
    expect(within(toggle).getByRole('button', { name: 'AND' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    // Старой жаргонной метки больше нет.
    expect(screen.queryByRole('group', { name: 'Combinator' })).toBeNull()
  })
})

// Кастомный renderRule консьюмера, намеренно не штампующий focus-атрибут.
// FilterRule сам оборачивает каждую строку в элемент с data-rule-path, поэтому
// управление фокусом работает без содействия рендерера.
function CustomHost({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <FilterBuilder
      value={value}
      onChange={setValue}
      renderRule={({ rule, update, idBase }) => (
        <div className="flex gap-2">
          <label className="sr-only" htmlFor={`${idBase}-condition`}>
            Condition
          </label>
          <input
            id={`${idBase}-condition`}
            value={String(rule.value ?? '')}
            onChange={(event) => update({ value: event.target.value })}
          />
        </div>
      )}
    />
  )
}

describe('FilterBuilder — focus works for custom renderRule', () => {
  it('moves focus into a custom row that stamps no path itself', () => {
    render(<CustomHost initial={{ combinator: 'and', rules: [makeRule('a')] }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add rule' }))

    // Централизованная обёртка штампует data-rule-path, хотя кастомный рендерер —
    // нет; фокус садится на кастомный инпут внутри новой строки. Disproof: убрать
    // contents-обёртку — адресуемой строки не останется, и фокус завис бы на кнопке Add rule.
    const newRow = ruleRowAt([1])
    const control = within(newRow).getByRole('textbox')
    expect(document.activeElement).toBe(control)
  })
})

// Хост, отвергающий удаления (гард min-rules), но принимающий любую другую правку,
// плюс кнопка, подменяющая дерево извне билдера. Воспроизводит устаревшее
// afterRemove-намерение: удаление записано, но не закоммичено, так что позднейший
// посторонний коммит не должен его разрешить.
function RejectRemoveHost({ initial }: { initial: FilterTree }) {
  const [value, setValue] = useState<FilterTree>(initial)
  return (
    <div>
      <button
        type="button"
        data-testid="external"
        onClick={() =>
          setValue({ combinator: 'and', rules: [makeRule('external')] })
        }
      >
        external change
      </button>
      <FilterBuilder
        value={value}
        onChange={(next) =>
          setValue((current) =>
            next.rules.length < current.rules.length ? current : next,
          )
        }
      />
    </div>
  )
}

describe('FilterBuilder — stale focus intent does not steal focus', () => {
  it('ignores a rejected remove when an unrelated commit follows', () => {
    render(
      <RejectRemoveHost
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
        }}
      />,
    )

    // Пробуем удалить среднее правило; хост его отвергает (коммита нет), поэтому
    // afterRemove-намерение остаётся pending, ожидая дерево, которое не придёт.
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove rule' })[1]!)
    expect(screen.getAllByLabelText('Field')).toHaveLength(3)

    // Посторонний внешний коммит меняет value на другое дерево. Гейт
    // (value === expected) должен отвергнуть устаревшее намерение, чтобы фокус не
    // выдернуло на строку. Disproof: убрать гейт — устаревшее намерение разрешится
    // против нового дерева и украдёт фокус на field первого правила.
    const external = screen.getByTestId('external')
    external.focus()
    fireEvent.click(external)

    expect(document.activeElement).toBe(external)
  })

  it('keeps focus in the edited row after a rejected remove', () => {
    render(
      <RejectRemoveHost
        initial={{
          combinator: 'and',
          rules: [makeRule('alpha'), makeRule('beta'), makeRule('gamma')],
        }}
      />,
    )

    // Отвергаем удаление, затем правим field другой строки. Правка сбрасывает
    // устаревшее намерение, а гейт это подстраховывает, так что фокус остаётся где печатают.
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove rule' })[1]!)

    // Field-инпут третьей строки (порядок строк сохранён; удаление отвергнуто, все
    // три уцелели).
    const gammaField = screen.getAllByLabelText('Field')[2] as HTMLInputElement
    expect(gammaField.value).toBe('gamma')
    gammaField.focus()
    fireEvent.change(gammaField, { target: { value: 'gamma-edited' } })

    expect(document.activeElement).toBe(gammaField)
    expect(gammaField.value).toBe('gamma-edited')
  })
})
