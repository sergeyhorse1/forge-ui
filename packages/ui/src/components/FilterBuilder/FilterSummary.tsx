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

/**
 * Compact, read-only projection of the same controlled `value` tree the
 * expanded editor renders. It shows each rule as a chip and each group as a
 * captioned block, recursing into nested groups. Switching between compact and
 * expanded is purely presentational — the data lives in `value`, so nothing is
 * lost. Chips wrap (`flex-wrap` + `break-words`) so a narrow container never
 * scrolls horizontally.
 */
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
  /**
   * When this group is itself an item of a parent group's list, it carries
   * `role="listitem"`; the root group carries no list role of its own.
   */
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
        // `role="list"` on the flex-wrap container plus `role="listitem"` on each
        // chip/nested-group (applied in place, not via a wrapper div, so the
        // layout is untouched) give the summary a semantic structure screen
        // readers announce as a list of conditions rather than a run of spans.
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
