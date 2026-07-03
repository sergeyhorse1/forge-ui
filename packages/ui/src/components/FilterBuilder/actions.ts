import type { Combinator, FilterPath, FilterSchema } from './types'
import type { RulePatch } from './tree'

// Единая точка диспатча, протянутая из FilterBuilder вниз по рекурсивному view.
// Метод адресует узел по FilterPath, применяет операцию над деревом и репортит
// результат через onChange консьюмера. View не трогает дерево напрямую и не держит
// свою копию — методы читают свежее дерево из ref в корне, поэтому объект остаётся
// референсно стабильным между рендерами (React.memo на строках/группах жив).
export interface FilterActions<S extends FilterSchema = FilterSchema> {
  addRule: (path: FilterPath) => void
  addGroup: (path: FilterPath) => void
  removeNode: (path: FilterPath) => void
  updateRule: (path: FilterPath, patch: RulePatch<S>) => void
  setCombinator: (path: FilterPath, combinator: Combinator) => void
}
