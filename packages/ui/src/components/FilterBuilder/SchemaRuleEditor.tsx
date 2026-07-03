import { cn } from '../../utils/cn'
import type { RenderRuleContext } from './FilterRule'
import { reconcileField, reconcileOperator } from './reconcile'
import { RuleValueControl } from './RuleValueControl'
import {
  fieldConfig,
  operatorsForField,
  operatorDefForField,
  type FilterFieldConfig,
  type FilterFieldSchema,
  type OperatorDef,
} from './schema'
import { removeButton, ruleControl, ruleRow } from './styles'
import type { RulePatch } from './tree'
import type { FilterSchema, FilterValue } from './types'

interface SchemaRuleEditorProps<S extends FilterSchema> {
  ctx: RenderRuleContext<S>
  schema: FilterFieldSchema
}

// Schema-driven редактор в шов renderRule: рисует <select> поля, <select> оператора
// (только валидные для поля) и подходящие по типу контролы значения. Смена
// поля/оператора гоняет чистую реконсиляцию, так что записанное правило всегда
// валидный триплет. Работает с пермиссивной формой (строки/JSON), поэтому патчи
// кастятся в RulePatch<S> — как и дефолтный редактор, не пытается удовлетворить
// discriminated union конкретной схемы на уровне типов (см. schema.ts).
export function SchemaRuleEditor<S extends FilterSchema>({
  ctx,
  schema,
}: SchemaRuleEditorProps<S>) {
  const { rule, update, remove, idBase } = ctx
  const field = String(rule.field)
  const operatorId = String(rule.operator)
  const config = fieldConfig(field, schema)
  const operators = operatorsForField(field, schema)
  const activeOperator = operatorDefForField(field, operatorId, schema)

  const onFieldChange = (nextField: string) => {
    update(reconcileField(toPermissive(rule), nextField, schema) as RulePatch<S>)
  }
  const onOperatorChange = (nextOperator: string) => {
    update(
      reconcileOperator(toPermissive(rule), nextOperator, schema) as RulePatch<S>,
    )
  }
  const onValueChange = (value: FilterValue) => {
    update({ value } as RulePatch<S>)
  }

  return (
    <div className={cn(ruleRow())}>
      <label className="sr-only" htmlFor={`${idBase}-field`}>
        Field
      </label>
      <select
        id={`${idBase}-field`}
        className={cn(ruleControl())}
        value={field}
        onChange={(event) => onFieldChange(event.target.value)}
      >
        {schema.map((entry) => (
          <option key={entry.field} value={entry.field}>
            {entry.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`${idBase}-operator`}>
        Operator
      </label>
      <select
        id={`${idBase}-operator`}
        className={cn(ruleControl())}
        value={operatorId}
        onChange={(event) => onOperatorChange(event.target.value)}
      >
        {operators.map((operator) => (
          <option key={operator.value} value={operator.value}>
            {operator.label}
          </option>
        ))}
      </select>

      {config !== undefined && activeOperator !== undefined && (
        <RuleValueSlot
          config={config}
          operator={activeOperator}
          value={rule.value}
          onChange={onValueChange}
          idBase={idBase}
        />
      )}

      <button
        type="button"
        className={cn(removeButton())}
        aria-label="Remove rule"
        onClick={remove}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}

// Тонкая обёртка, чтобы тело редактора читалось; матрица контролов — в RuleValueControl.
interface RuleValueSlotProps {
  config: FilterFieldConfig
  operator: OperatorDef
  value: FilterValue
  onChange: (value: FilterValue) => void
  idBase: string
}

function RuleValueSlot({
  config,
  operator,
  value,
  onChange,
  idBase,
}: RuleValueSlotProps) {
  return (
    <RuleValueControl
      config={config}
      operator={operator}
      value={value}
      onChange={onChange}
      idBase={idBase}
      label={`${config.label} value`}
    />
  )
}

// Читает правило как пермиссивный триплет, с которым работает реконсайлер.
function toPermissive<S extends FilterSchema>(
  rule: RenderRuleContext<S>['rule'],
): { field: string; operator: string; value: FilterValue } {
  return {
    field: String(rule.field),
    operator: String(rule.operator),
    value: rule.value,
  }
}
