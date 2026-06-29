import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ColumnDef } from './types'
import { useDataGrid } from './useDataGrid'

interface Person {
  id: number
  name: string
  age: number
}

const PEOPLE: Person[] = [
  { id: 1, name: 'Carol', age: 30 },
  { id: 2, name: 'Alice', age: 42 },
  { id: 3, name: 'Bob', age: 30 },
]

const COLUMNS: ColumnDef<Person>[] = [
  { id: 'name', header: 'Name', minWidth: 80, width: 200 },
  { id: 'age', header: 'Age', accessor: (row) => row.age },
]

const getRowKey = (row: Person) => row.id

function setup(
  overrides: Partial<Parameters<typeof useDataGrid<Person>>[0]> = {},
) {
  return renderHook(() =>
    useDataGrid<Person>({
      rows: PEOPLE,
      columns: COLUMNS,
      getRowKey,
      ...overrides,
    }),
  )
}

describe('useDataGrid – sorting', () => {
  it('cycles a single column asc -> desc -> none', () => {
    const { result } = setup()

    act(() => result.current.sort.toggle('name', false))
    expect(result.current.rows.map((r) => r.name)).toEqual([
      'Alice',
      'Bob',
      'Carol',
    ])

    act(() => result.current.sort.toggle('name', false))
    expect(result.current.rows.map((r) => r.name)).toEqual([
      'Carol',
      'Bob',
      'Alice',
    ])

    act(() => result.current.sort.toggle('name', false))
    expect(result.current.rows).toEqual(PEOPLE)
    expect(result.current.sort.state).toEqual([])
  })

  it('keeps the sort stable for tied rows', () => {
    const { result } = setup()
    act(() => result.current.sort.toggle('age', false))
    // Carol (id1) and Bob (id3) both 30 -> input order preserved before Alice.
    expect(result.current.rows.map((r) => r.id)).toEqual([1, 3, 2])
  })

  it('supports additive multi-sort when enabled', () => {
    const { result } = setup({ sort: { multiSort: true } })

    act(() => result.current.sort.toggle('age', false))
    act(() => result.current.sort.toggle('name', true))

    expect(result.current.sort.state).toHaveLength(2)
    expect(result.current.sort.infoFor('age').priority).toBe(1)
    expect(result.current.sort.infoFor('name').priority).toBe(2)
    // age asc, then name asc: 30/Bob, 30/Carol, 42/Alice
    expect(result.current.rows.map((r) => r.id)).toEqual([3, 1, 2])
  })

  it('replaces the sort when additive is false even in multi mode', () => {
    const { result } = setup({ sort: { multiSort: true } })
    act(() => result.current.sort.toggle('age', false))
    act(() => result.current.sort.toggle('name', false))
    expect(result.current.sort.state).toHaveLength(1)
    expect(result.current.sort.state[0]!.columnId).toBe('name')
  })
})

describe('useDataGrid – selection', () => {
  it('single mode keeps at most one selected row', () => {
    const { result } = setup({ selection: { mode: 'single' } })

    act(() => result.current.selection.toggle(1))
    act(() => result.current.selection.toggle(2))

    expect([...result.current.selection.selectedKeys]).toEqual([2])
  })

  it('multi mode toggles independently and supports select-all', () => {
    const { result } = setup({ selection: { mode: 'multi' } })

    act(() => result.current.selection.toggle(1))
    act(() => result.current.selection.toggle(3))
    expect(result.current.selection.selectedKeys.size).toBe(2)
    expect(result.current.selection.someSelected).toBe(true)

    act(() => result.current.selection.toggleAll())
    expect(result.current.selection.allSelected).toBe(true)

    act(() => result.current.selection.toggleAll())
    expect(result.current.selection.selectedKeys.size).toBe(0)
  })

  it('none mode ignores toggles', () => {
    const { result } = setup({ selection: { mode: 'none' } })
    act(() => result.current.selection.toggle(1))
    expect(result.current.selection.selectedKeys.size).toBe(0)
  })

  it('reports controlled selection changes', () => {
    const onChange = vi.fn()
    const { result } = setup({ selection: { mode: 'multi', onChange } })
    act(() => result.current.selection.toggle(2))
    expect(onChange).toHaveBeenCalledWith(new Set([2]))
  })
})

describe('useDataGrid – column layout & resize', () => {
  it('splits frozen columns out and orders them first', () => {
    const columns: ColumnDef<Person>[] = [
      { id: 'age', header: 'Age' },
      { id: 'name', header: 'Name', frozen: true, width: 120 },
    ]
    const { result } = setup({ columns })

    expect(result.current.frozenColumns.map((c) => c.id)).toEqual(['name'])
    expect(result.current.scrollColumns.map((c) => c.id)).toEqual(['age'])
    expect(result.current.columns.map((c) => c.id)).toEqual(['name', 'age'])
    expect(result.current.frozenWidth).toBe(120)
  })

  it('nudges a column width and clamps to minWidth', () => {
    const { result } = setup()
    expect(result.current.columns.find((c) => c.id === 'name')!.width).toBe(200)

    act(() => result.current.resize.nudge('name', -40))
    expect(result.current.columns.find((c) => c.id === 'name')!.width).toBe(160)

    // minWidth is 80; large negative nudge must not go below it.
    act(() => result.current.resize.nudge('name', -1000))
    expect(result.current.columns.find((c) => c.id === 'name')!.width).toBe(80)
  })

  it('reports controlled width changes', () => {
    const onColumnWidthsChange = vi.fn()
    const { result } = setup({ onColumnWidthsChange })
    act(() => result.current.resize.nudge('age', 20))
    expect(onColumnWidthsChange).toHaveBeenCalled()
  })
})
