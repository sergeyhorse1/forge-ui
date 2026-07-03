import { cn } from '../../utils/cn'
import {
  ruleControl,
  ruleMultiControl,
  ruleRangeGroup,
  ruleRangeSeparator,
} from './styles'
import type { FilterFieldConfig, OperatorDef } from './schema'
import type { FilterValue } from './types'

interface RuleValueControlProps {
  config: FilterFieldConfig
  operator: OperatorDef
  value: FilterValue
  onChange: (value: FilterValue) => void
  idBase: string
  label: string
}

// Schema-driven редактор значения одного правила: подбирает нативные контролы из
// type поля и inputKind оператора — single (один по типу), range (два, значение
// [a,b]), multi/enum in (select multiple, массив). У каждого свой <label htmlFor>
// от idBase.
export function RuleValueControl(props: RuleValueControlProps) {
  const { operator } = props
  if (operator.inputKind === 'range') return <RangeValue {...props} />
  if (operator.inputKind === 'multi') return <MultiValue {...props} />
  return <SingleValue {...props} />
}

function SingleValue({
  config,
  value,
  onChange,
  idBase,
  label,
}: RuleValueControlProps) {
  const id = `${idBase}-value`
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <ScalarControl id={id} config={config} value={value} onChange={onChange} />
    </>
  )
}

function RangeValue({
  config,
  value,
  onChange,
  idBase,
  label,
}: RuleValueControlProps) {
  const pair = asPair(value)
  const fromId = `${idBase}-value-from`
  const toId = `${idBase}-value-to`
  return (
    <div className={cn(ruleRangeGroup())}>
      <label className="sr-only" htmlFor={fromId}>
        {label} from
      </label>
      <ScalarControl
        id={fromId}
        config={config}
        value={pair[0]}
        onChange={(next) => onChange([next, pair[1]])}
      />
      <span className={cn(ruleRangeSeparator())} aria-hidden="true">
        –
      </span>
      <label className="sr-only" htmlFor={toId}>
        {label} to
      </label>
      <ScalarControl
        id={toId}
        config={config}
        value={pair[1]}
        onChange={(next) => onChange([pair[0], next])}
      />
    </div>
  )
}

function MultiValue({
  config,
  value,
  onChange,
  idBase,
  label,
}: RuleValueControlProps) {
  const id = `${idBase}-value`
  const options = config.type === 'enum' ? config.options : []
  const selected = asArray(value).map(String)
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        multiple
        className={cn(ruleMultiControl())}
        value={selected}
        onChange={(event) => {
          const picked = Array.from(event.target.selectedOptions, (option) =>
            decodeOption(option.value, options),
          )
          onChange(picked)
        }}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  )
}

interface ScalarControlProps {
  id: string
  config: FilterFieldConfig
  value: FilterValue
  onChange: (value: FilterValue) => void
}

function ScalarControl({ id, config, value, onChange }: ScalarControlProps) {
  if (config.type === 'boolean') {
    return (
      <select
        id={id}
        className={cn(ruleControl())}
        value={value === true ? 'true' : 'false'}
        onChange={(event) => onChange(event.target.value === 'true')}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    )
  }

  if (config.type === 'enum') {
    const options = config.options
    return (
      <select
        id={id}
        className={cn(ruleControl())}
        value={scalarString(value)}
        onChange={(event) => onChange(decodeOption(event.target.value, options))}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (config.type === 'number') {
    return (
      <input
        id={id}
        type="number"
        className={cn(ruleControl())}
        value={scalarString(value)}
        onChange={(event) =>
          onChange(event.target.value === '' ? '' : Number(event.target.value))
        }
      />
    )
  }

  const inputType = config.type === 'date' ? 'date' : 'text'
  return (
    <input
      id={id}
      type={inputType}
      className={cn(ruleControl())}
      value={scalarString(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

function asPair(value: FilterValue): [FilterValue, FilterValue] {
  if (Array.isArray(value)) return [value[0] ?? '', value[1] ?? '']
  return ['', '']
}

function asArray(value: FilterValue): FilterValue[] {
  return Array.isArray(value) ? value : []
}

function scalarString(value: FilterValue): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value) || typeof value === 'object') return ''
  return String(value)
}

// Возвращает исходное типизированное значение опции по её строковому value
// (числовые опции остаются числами), иначе — сырую строку.
function decodeOption(
  raw: string,
  options: readonly { value: string | number }[],
): FilterValue {
  const match = options.find((option) => String(option.value) === raw)
  return match ? match.value : raw
}
