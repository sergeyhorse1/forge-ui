import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ColumnDef, SelectionOptions, SortState } from './types'
import { MAX_COLUMN_WIDTH, MIN_COLUMN_WIDTH } from './types'
import { useDataGrid } from './useDataGrid'

interface Player {
  id: number
  team: string
  score: number
  joined: Date | null
}

const PLAYERS: Player[] = [
  { id: 1, team: 'Red', score: 10, joined: new Date('2024-01-02') },
  { id: 2, team: 'Blue', score: 10, joined: new Date('2024-01-01') },
  { id: 3, team: 'Red', score: 7, joined: null },
  { id: 4, team: 'Blue', score: 7, joined: new Date('2024-03-01') },
]

const COLUMNS: ColumnDef<Player>[] = [
  { id: 'team', header: 'Team' },
  { id: 'score', header: 'Score', accessor: (row) => row.score },
  { id: 'joined', header: 'Joined', accessor: (row) => row.joined },
]

const getRowKey = (row: Player) => row.id

function setup(
  overrides: Partial<Parameters<typeof useDataGrid<Player>>[0]> = {},
) {
  return renderHook(
    (props: Partial<Parameters<typeof useDataGrid<Player>>[0]>) =>
      useDataGrid<Player>({
        rows: PLAYERS,
        columns: COLUMNS,
        getRowKey,
        ...props,
      }),
    { initialProps: overrides },
  )
}

describe('DataGrid sorting – multi-key tie-breaks', () => {
  it('falls through to the secondary key only when the primary ties', () => {
    const { result } = setup({ sort: { multiSort: true } })

    // Primary: team asc. Secondary: score desc.
    act(() => result.current.sort.toggle('team', false))
    act(() => result.current.sort.toggle('score', true))
    act(() => result.current.sort.toggle('score', true)) // asc -> desc

    expect(result.current.sort.infoFor('team').priority).toBe(1)
    expect(result.current.sort.infoFor('score').priority).toBe(2)
    expect(result.current.sort.infoFor('score').direction).toBe('desc')

    // Blue before Red (team asc); within each team, higher score first.
    expect(result.current.rows.map((r) => r.id)).toEqual([2, 4, 1, 3])
  })

  it('keeps tied rows in input order when every active key is equal', () => {
    // Only the team key is sorted; the two Red rows (ids 1, 3) tie and must
    // retain their original relative order, likewise the two Blue rows.
    const { result } = setup({ sort: { multiSort: true } })
    act(() => result.current.sort.toggle('team', false))

    expect(result.current.rows.map((r) => r.id)).toEqual([2, 4, 1, 3])
  })

  it('cycles one column out of a multi-sort without disturbing the others', () => {
    const { result } = setup({ sort: { multiSort: true } })
    act(() => result.current.sort.toggle('team', false))
    act(() => result.current.sort.toggle('score', true))

    // Cycle score asc -> desc -> none; team must remain the lone criterion.
    act(() => result.current.sort.toggle('score', true))
    act(() => result.current.sort.toggle('score', true))

    expect(result.current.sort.state).toHaveLength(1)
    expect(result.current.sort.state[0]!.columnId).toBe('team')
    expect(result.current.sort.infoFor('score').direction).toBeNull()
  })

  it('omits the priority badge while only one column is sorted', () => {
    const { result } = setup({ sort: { multiSort: true } })
    act(() => result.current.sort.toggle('team', false))
    expect(result.current.sort.infoFor('team').priority).toBeNull()
  })

  it('keeps a column priority when its direction changes in place', () => {
    const { result } = setup({ sort: { multiSort: true } })
    // team (priority 1), score (priority 2), joined (priority 3).
    act(() => result.current.sort.toggle('team', false))
    act(() => result.current.sort.toggle('score', true))
    act(() => result.current.sort.toggle('joined', true))
    expect(result.current.sort.infoFor('score').priority).toBe(2)

    // Re-toggling the *middle* column (asc -> desc) must not demote it to last:
    // the previous filter+append put it at the end and reshuffled priorities.
    act(() => result.current.sort.toggle('score', true))
    expect(result.current.sort.infoFor('score').direction).toBe('desc')
    expect(result.current.sort.infoFor('team').priority).toBe(1)
    expect(result.current.sort.infoFor('score').priority).toBe(2)
    expect(result.current.sort.infoFor('joined').priority).toBe(3)
  })

  it('ignores a toggle for a column id that does not exist', () => {
    const { result } = setup({ sort: { multiSort: true } })
    const before = result.current.rows
    act(() => result.current.sort.toggle('does-not-exist', false))
    // No phantom entry, and the derived rows keep referential identity.
    expect(result.current.sort.state).toEqual([])
    expect(result.current.rows).toBe(before)
  })
})

describe('DataGrid sorting – mixed-type comparator is a total order', () => {
  interface Mixed {
    id: number
    value: unknown
  }
  // A single column whose values span number, string, Date and null. A
  // comparator that only fast-paths same-typed pairs and otherwise localeCompares
  // their String() forms is intransitive, so the resulting order depends on the
  // input permutation. Ranking by type first makes the order deterministic.
  const sortValues = (values: unknown[]) => {
    const rows: Mixed[] = values.map((value, id) => ({ id, value }))
    const columns: ColumnDef<Mixed>[] = [
      { id: 'value', header: 'Value', accessor: (row) => row.value },
    ]
    const { result } = renderHook(() =>
      useDataGrid<Mixed>({ rows, columns, getRowKey: (row) => row.id }),
    )
    act(() => result.current.sort.toggle('value', false))
    return result.current.rows.map((row) => row.value)
  }

  it('produces the same order regardless of input permutation', () => {
    const mixed = [42, 'apple', new Date('2024-01-01'), null, 7, 'zebra']
    const a = sortValues(mixed)
    const b = sortValues([...mixed].reverse())
    const c = sortValues([mixed[3], mixed[1], mixed[5], mixed[0], mixed[4], mixed[2]])
    expect(b).toEqual(a)
    expect(c).toEqual(a)
  })

  it('sinks nullish values to the front of an ascending sort', () => {
    const order = sortValues(['b', null, 'a'])
    expect(order[0]).toBeNull()
  })
})

describe('DataGrid sorting – value comparison', () => {
  it('orders dates chronologically and sinks nullish values', () => {
    const { result } = setup()
    act(() => result.current.sort.toggle('joined', false))

    // Ascending: null first, then earliest to latest by timestamp.
    expect(result.current.rows.map((r) => r.id)).toEqual([3, 2, 1, 4])
  })

  it('honours a custom comparator over the default accessor order', () => {
    const columns: ColumnDef<Player>[] = [
      {
        id: 'team',
        header: 'Team',
        // Sort by score descending regardless of the team label.
        compare: (a, b) => b.score - a.score,
      },
    ]
    const { result } = setup({ columns })
    act(() => result.current.sort.toggle('team', false))

    expect(result.current.rows.map((r) => r.score)).toEqual([10, 10, 7, 7])
  })
})

describe('DataGrid sorting – controlled state', () => {
  it('derives row order from a controlled sort value', () => {
    const controlled: SortState<Player>[] = [
      { columnId: 'score', direction: 'asc' },
    ]
    const { result } = setup({ sort: { value: controlled } })

    expect(result.current.rows.map((r) => r.score)).toEqual([7, 7, 10, 10])
  })

  it('reports toggles through onChange without mutating a controlled value', () => {
    const onChange = vi.fn()
    const controlled: SortState<Player>[] = []
    const { result } = setup({ sort: { value: controlled, onChange } })

    act(() => result.current.sort.toggle('score', false))

    expect(onChange).toHaveBeenCalledWith([
      { columnId: 'score', direction: 'asc' },
    ])
    // The controlled prop stayed empty: the parent owns the state.
    expect(result.current.sort.state).toEqual([])
  })
})

describe('DataGrid selection – clear and single-mode reset', () => {
  it('deselects a single-mode row when its own key is toggled again', () => {
    const { result } = setup({ selection: { mode: 'single' } })
    act(() => result.current.selection.toggle(1))
    expect([...result.current.selection.selectedKeys]).toEqual([1])

    act(() => result.current.selection.toggle(1))
    expect(result.current.selection.selectedKeys.size).toBe(0)
  })

  it('clears every selected key in multi mode', () => {
    const { result } = setup({ selection: { mode: 'multi' } })
    act(() => result.current.selection.toggle(1))
    act(() => result.current.selection.toggle(2))
    expect(result.current.selection.selectedKeys.size).toBe(2)

    act(() => result.current.selection.clear())
    expect(result.current.selection.selectedKeys.size).toBe(0)
    expect(result.current.selection.someSelected).toBe(false)
    expect(result.current.selection.allSelected).toBe(false)
  })

  it('drives selection from a controlled value set', () => {
    const value: SelectionOptions['value'] = new Set([2, 4])
    const { result } = setup({ selection: { mode: 'multi', value } })

    expect(result.current.selection.isSelected(2)).toBe(true)
    expect(result.current.selection.isSelected(4)).toBe(true)
    expect(result.current.selection.isSelected(1)).toBe(false)
    expect(result.current.selection.allSelected).toBe(false)
  })

  it('treats every row selected as allSelected, not someSelected', () => {
    const { result } = setup({ selection: { mode: 'multi' } })
    act(() => result.current.selection.toggleAll())

    expect(result.current.selection.allSelected).toBe(true)
    expect(result.current.selection.someSelected).toBe(false)
    expect(result.current.selection.selectedKeys.size).toBe(PLAYERS.length)
  })

  it('is not indeterminate when only stale (non-visible) keys remain selected', () => {
    // A controlled set holding a key for a row that is not in the data must not
    // light up the tristate: no *visible* row is selected.
    const value: SelectionOptions['value'] = new Set([999])
    const { result } = setup({ selection: { mode: 'multi', value } })

    expect(result.current.selection.someSelected).toBe(false)
    expect(result.current.selection.allSelected).toBe(false)
  })

  it('is indeterminate when at least one visible row is selected', () => {
    const value: SelectionOptions['value'] = new Set([2, 999])
    const { result } = setup({ selection: { mode: 'multi', value } })

    expect(result.current.selection.someSelected).toBe(true)
  })

  it('toggleAll is a no-op on an empty dataset', () => {
    const onChange = vi.fn()
    const { result } = setup({
      rows: [],
      selection: { mode: 'multi', onChange },
    })
    act(() => result.current.selection.toggleAll())

    expect(result.current.selection.allSelected).toBe(false)
    expect(result.current.selection.someSelected).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('DataGrid column resize – pointer drag', () => {
  it('widens a column as the pointer drags right', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: 150, minWidth: 100 },
      { id: 'score', header: 'Score' },
    ]
    const { result } = setup({ columns })

    act(() => result.current.resize.start('team', 0))
    act(() => {
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 60 }),
      )
    })
    act(() => window.dispatchEvent(new MouseEvent('pointerup')))

    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(210)
    expect(result.current.resize.activeColumnId).toBeNull()
  })

  it('clamps a pointer drag at the column minWidth', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: 150, minWidth: 120 },
      { id: 'score', header: 'Score' },
    ]
    const { result } = setup({ columns })

    act(() => result.current.resize.start('team', 200))
    act(() => {
      // Drag far to the left, well past the minimum.
      window.dispatchEvent(new MouseEvent('pointermove', { clientX: 0 }))
    })

    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(120)
  })
})

describe('DataGrid column resize – widths and constraints', () => {
  it('falls back to the declared width before any resize', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: 180 },
    ]
    const { result } = setup({ columns })
    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(180)
  })

  it('clamps a keyboard nudge to the default minimum when none is declared', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: 90 },
    ]
    const { result } = setup({ columns })
    act(() => result.current.resize.nudge('team', -200))
    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(
      MIN_COLUMN_WIDTH,
    )
  })

  it('applies controlled column widths over the declared defaults', () => {
    const onColumnWidthsChange = vi.fn()
    const { result } = setup({
      columns: [{ id: 'team', header: 'Team', width: 150 }],
      columnWidths: { team: 240 },
      onColumnWidthsChange,
    })
    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(240)

    act(() => result.current.resize.nudge('team', 20))
    expect(onColumnWidthsChange).toHaveBeenCalledWith({ team: 260 })
  })

  it('clamps a width to MAX_COLUMN_WIDTH so it never exceeds aria-valuemax', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: MAX_COLUMN_WIDTH - 10 },
    ]
    const { result } = setup({ columns })
    act(() => result.current.resize.nudge('team', 1000))
    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(
      MAX_COLUMN_WIDTH,
    )
  })

  it('accumulates back-to-back synchronous nudges without dropping steps', () => {
    const columns: ColumnDef<Player>[] = [
      { id: 'team', header: 'Team', width: 200 },
    ]
    const { result } = setup({ columns })
    act(() => {
      result.current.resize.nudge('team', 16)
      result.current.resize.nudge('team', 16)
      result.current.resize.nudge('team', 16)
    })
    // Three 16px steps from 200 land on 248, not 216 (which a stale-closure read
    // of the width would produce).
    expect(result.current.columns.find((c) => c.id === 'team')!.width).toBe(248)
  })
})

describe('DataGrid – reacting to dataset changes', () => {
  it('re-applies the active sort when the rows prop changes', () => {
    const { result, rerender } = setup({ sort: { multiSort: false } })
    act(() => result.current.sort.toggle('score', false))
    expect(result.current.rows.map((r) => r.id)).toEqual([3, 4, 1, 2])

    const moreRows: Player[] = [
      ...PLAYERS,
      { id: 5, team: 'Green', score: 1, joined: null },
    ]
    rerender({ sort: { multiSort: false }, rows: moreRows })

    // The new low-score row sorts to the front under the still-active asc sort.
    expect(result.current.rows[0]!.id).toBe(5)
  })
})
