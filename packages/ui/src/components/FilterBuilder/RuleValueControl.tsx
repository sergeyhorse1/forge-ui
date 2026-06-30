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
  /** Stable id prefix for label/control association. */
  idBase: string
  /** Visually-hidden label text describing this control. */
  label: string
}

/**
 * The schema-driven value editor for one rule. It picks the right native
 * control(s) from the field's `type` and the operator's `inputKind`:
 * - `single` → one control matching the type (text / number / date / boolean
 *   select / enum select),
 * - `range` → two type-matched controls laid out with flex, value `[a, b]`,
 * - `multi` (enum `in`) → a `<select multiple>`, value an array.
 *
 * Every control carries an associated `<label htmlFor>` derived from `idBase`.
 */
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

/** One scalar control whose widget matches the field's `type`. */
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

/** Coerce an arbitrary value into the `[from, to]` pair a range control reads. */
function asPair(value: FilterValue): [FilterValue, FilterValue] {
  if (Array.isArray(value)) return [value[0] ?? '', value[1] ?? '']
  return ['', '']
}

/** Coerce an arbitrary value into the array a multi control reads. */
function asArray(value: FilterValue): FilterValue[] {
  return Array.isArray(value) ? value : []
}

/** Render a scalar as the string a native input/select `value` expects. */
function scalarString(value: FilterValue): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value) || typeof value === 'object') return ''
  return String(value)
}

/**
 * Map a selected option's string `value` back to the option's original typed
 * value (number options stay numbers), falling back to the raw string.
 */
function decodeOption(
  raw: string,
  options: readonly { value: string | number }[],
): FilterValue {
  const match = options.find((option) => String(option.value) === raw)
  return match ? match.value : raw
}
