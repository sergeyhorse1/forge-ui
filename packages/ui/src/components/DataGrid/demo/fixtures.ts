import type { ColumnDef } from '../types'

export interface DemoRow {
  id: number
  name: string
  email: string
  team: string
  score: number
  active: boolean
  [extra: string]: string | number | boolean
}

const FIRST = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Edsger', 'Barbara']
const LAST = ['Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Liskov']
const TEAMS = ['Platform', 'Growth', 'Infra', 'Design', 'Data', 'Security']

/** Deterministic pseudo-random generator so stories render identically. */
function mulberry32(seed: number): () => number {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Build `rowCount` rows; the first 6 fields are typed, the rest are `metric_N`. */
export function makeRows(rowCount: number, extraColumns = 0): DemoRow[] {
  const random = mulberry32(rowCount)
  const rows: DemoRow[] = []
  for (let i = 0; i < rowCount; i += 1) {
    const first = FIRST[Math.floor(random() * FIRST.length)]!
    const last = LAST[Math.floor(random() * LAST.length)]!
    const row: DemoRow = {
      id: i + 1,
      name: `${first} ${last}`,
      email: `${first}.${last}@example.com`.toLowerCase(),
      team: TEAMS[Math.floor(random() * TEAMS.length)]!,
      score: Math.floor(random() * 1000),
      active: random() > 0.5,
    }
    for (let c = 0; c < extraColumns; c += 1) {
      row[`metric_${c}`] = Math.floor(random() * 10000)
    }
    rows.push(row)
  }
  return rows
}

/** Columns for the small functional demos. */
export const demoColumns: ColumnDef<DemoRow>[] = [
  { id: 'id', header: 'ID', width: 80, align: 'right', frozen: true },
  { id: 'name', header: 'Name', width: 200, frozen: true },
  { id: 'email', header: 'Email', width: 260 },
  { id: 'team', header: 'Team', width: 140 },
  { id: 'score', header: 'Score', width: 120, align: 'right' },
  {
    id: 'active',
    header: 'Active',
    width: 100,
    cell: (row) => (row.active ? 'Yes' : 'No'),
  },
]

/** A 30-column set (2 frozen + 28 scroll) used by the perf stories. */
export function makePerfColumns(): ColumnDef<DemoRow>[] {
  const base: ColumnDef<DemoRow>[] = [
    { id: 'id', header: 'ID', width: 80, align: 'right', frozen: true },
    { id: 'name', header: 'Name', width: 180, frozen: true },
    { id: 'email', header: 'Email', width: 240 },
    { id: 'team', header: 'Team', width: 130 },
  ]
  const metrics: ColumnDef<DemoRow>[] = Array.from({ length: 26 }, (_, c) => ({
    id: `metric_${c}`,
    header: `Metric ${c + 1}`,
    width: 110,
    align: 'right' as const,
  }))
  return [...base, ...metrics]
}

export const getRowKey = (row: DemoRow) => row.id
