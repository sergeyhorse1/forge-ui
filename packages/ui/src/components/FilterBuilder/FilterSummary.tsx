import { cn } from '../../utils/cn'
import type { FilterFieldSchema } from './schema'
import {
  summaryChip,
  summaryChildren,
  summaryChipField,
  summaryChipOperator,
  summaryChipValue,
  summaryCombinator,
  summaryGroup,
  summaryRoot,
} from './styles'
import { summarizeGroup, summarizeRule } from './summary'
import { isGroup } from './types'
import type {
  FilterGroup as FilterGroupModel,
  FilterNode,
  FilterRule as FilterRuleModel,
  FilterSchema,
  FilterTree,
} from './types'

interface FilterSummaryProps<S extends FilterSchema> {
  tree: FilterTree<S>
  schema: FilterFieldSchema
}

// Компактная read-only проекция того же controlled value-дерева, что рисует
// расширенный редактор: правило — чип, группа — блок с подписью, рекурсивно.
// Переключение compact/expanded чисто презентационное — данные в value, ничего не
// теряется. Чипы переносятся (flex-wrap + break-words), узкий контейнер не скроллит
// горизонтально.
export function FilterSummary<S extends FilterSchema>({
  tree,
  schema,
}: FilterSummaryProps<S>) {
  return (
    <div className={cn(summaryRoot())}>
      <SummaryGroup group={tree} schema={schema} isRoot />
    </div>
  )
}

interface SummaryGroupProps<S extends FilterSchema> {
  group: FilterGroupModel<S>
  schema: FilterFieldSchema
  isRoot?: boolean
  // Когда группа сама — элемент списка родителя, несёт role="listitem"; у корневой
  // своей list-роли нет.
  listRole?: 'listitem'
}

function SummaryGroup<S extends FilterSchema>({
  group,
  schema,
  isRoot = false,
  listRole,
}: SummaryGroupProps<S>) {
  return (
    <div className={cn(summaryGroup({ root: isRoot }))} role={listRole}>
      <span className={cn(summaryCombinator())}>{summarizeGroup(group)}</span>
      {group.rules.length > 0 && (
        // role="list" на flex-wrap контейнере плюс role="listitem" на каждом
        // чипе/вложенной группе (на месте, без обёртки, чтобы не трогать layout)
        // дают summary семантику списка условий, а не набора спанов.
        <div className={cn(summaryChildren())} role="list">
          {group.rules.map((child, index) => {
            const node: FilterNode<S> = child
            if (isGroup(node)) {
              return (
                <SummaryGroup
                  key={index}
                  group={node}
                  schema={schema}
                  listRole="listitem"
                />
              )
            }
            return <RuleChip key={index} rule={node} schema={schema} />
          })}
        </div>
      )}
    </div>
  )
}

interface RuleChipProps<S extends FilterSchema> {
  rule: FilterRuleModel<S>
  schema: FilterFieldSchema
}

function RuleChip<S extends FilterSchema>({ rule, schema }: RuleChipProps<S>) {
  const parts = summarizeRule(rule, schema)
  return (
    <span className={cn(summaryChip())} role="listitem">
      <span className={cn(summaryChipField())}>{parts.field}</span>
      <span className={cn(summaryChipOperator())}>{parts.operator}</span>
      <span className={cn(summaryChipValue())}>{parts.value}</span>
    </span>
  )
}
