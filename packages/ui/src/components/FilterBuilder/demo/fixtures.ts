import type { FilterGroup, FilterNode, FilterTree } from '../types'

// Чистый генератор реалистично-формованного дерева фильтров для perf-стори и
// perf-теста. Правила раскиданы по вложенным подгруппам, а не плоско, чтобы дерево
// гоняло рекурсивный рендер и операции со структурным шарингом как настоящий глубокий
// фильтр (groupSize — целевое число правил на подгруппу). Вызов держать ленивым
// (useMemo в стори, inline в тесте): дерево на сотни узлов зря тормозит импорт файла —
// уже кусало демки DataGrid.
export function makeFilterTree(ruleCount: number, groupSize = 10): FilterTree {
  if (ruleCount < 0) throw new Error('ruleCount must be non-negative')
  if (groupSize < 1) throw new Error('groupSize must be at least 1')

  const root: FilterGroup = { combinator: 'and', rules: [] }
  let currentGroup: FilterGroup = root

  for (let index = 0; index < ruleCount; index += 1) {
    // Каждые groupSize правил заводим новую подгруппу под корнем и наполняем её.
    // Корень держит пару прямых правил, чтобы рядом с первой подгруппой был
    // сиблинг-правило (зеркалит вложенный тест-кейс).
    if (index > 0 && index % groupSize === 0) {
      const nested: FilterGroup = {
        combinator: index % (groupSize * 2) === 0 ? 'or' : 'and',
        rules: [],
      }
      root.rules.push(nested)
      currentGroup = nested
    }
    currentGroup.rules.push(makeRule(index))
  }

  return root
}

// Одно детерминированное правило; field уникален, чтобы ключевать render-map.
function makeRule(index: number): FilterNode {
  const kind = index % 3
  if (kind === 0) {
    return { field: `field_${index}`, operator: 'contains', value: `q${index}` }
  }
  if (kind === 1) {
    return { field: `field_${index}`, operator: 'gt', value: index }
  }
  return { field: `field_${index}`, operator: 'eq', value: index % 2 === 0 }
}
