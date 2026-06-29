import type { ReactNode } from 'react'

/** Horizontal text alignment for a column's header and cells. */
export type ColumnAlign = 'left' | 'center' | 'right'

/** Direction of a single sort criterion. */
export type SortDirection = 'asc' | 'desc'

/**
 * A single active sort criterion. Multi-sort is expressed as an ordered list of
 * these, the first entry being the primary key.
 */
export interface SortState<TRow> {
  columnId: ColumnId<TRow>
  direction: SortDirection
}

/** Identifier of a column, used everywhere a column is referenced by key. */
export type ColumnId<TRow> = Extract<keyof TRow, string> | (string & {})

/**
 * Declarative description of one grid column.
 *
 * `accessor`/`cell` decide what is rendered; the remaining fields drive layout
 * (`width`/`minWidth`/`align`), stickiness (`frozen`) and behaviour
 * (`sortable`/`resizable`).
 */
export interface ColumnDef<TRow> {
  /** Stable column identifier. Also the default sort key. */
  id: ColumnId<TRow>
  /** Header content. A string is rendered verbatim. */
  header: ReactNode | ((column: ColumnDef<TRow>) => ReactNode)
  /** Pull a primitive value out of a row (used for the default cell + sorting). */
  accessor?: (row: TRow) => unknown
  /** Custom cell renderer. Falls back to `accessor`/`row[id]` stringified. */
  cell?: (row: TRow, rowIndex: number) => ReactNode
  /** Fixed starting width in px. Defaults to {@link DEFAULT_COLUMN_WIDTH}. */
  width?: number
  /** Lower bound honoured while resizing. Defaults to {@link MIN_COLUMN_WIDTH}. */
  minWidth?: number
  /** Pin the column to the left edge as a non-scrolling frozen layer. */
  frozen?: boolean
  /** Cell + header alignment. Defaults to `'left'`. */
  align?: ColumnAlign
  /** Allow sorting by this column. Defaults to `true`. */
  sortable?: boolean
  /** Allow drag-resizing this column. Defaults to `true`. */
  resizable?: boolean
  /** Custom comparator. Receives raw rows; defaults to accessor comparison. */
  compare?: (a: TRow, b: TRow) => number
}

/** How rows may be selected. */
export type SelectionMode = 'none' | 'single' | 'multi'

/** Extract a stable, unique key for a row. */
export type RowKey<TRow> = (row: TRow, index: number) => string | number

/** Controlled/uncontrolled multi-sort configuration. */
export interface SortOptions<TRow> {
  multiSort?: boolean
  value?: SortState<TRow>[]
  defaultValue?: SortState<TRow>[]
  onChange?: (next: SortState<TRow>[]) => void
}

/** Controlled/uncontrolled selection configuration. */
export interface SelectionOptions {
  mode?: SelectionMode
  value?: ReadonlySet<string | number>
  defaultValue?: ReadonlySet<string | number>
  onChange?: (next: Set<string | number>) => void
}

/** Options accepted by the headless {@link useDataGrid} hook. */
export interface UseDataGridOptions<TRow> {
  rows: readonly TRow[]
  columns: readonly ColumnDef<TRow>[]
  getRowKey: RowKey<TRow>
  sort?: SortOptions<TRow>
  selection?: SelectionOptions
  /** Controlled column widths keyed by column id (overrides `ColumnDef.width`). */
  columnWidths?: Record<string, number>
  defaultColumnWidths?: Record<string, number>
  onColumnWidthsChange?: (next: Record<string, number>) => void
}

/** A column augmented with its resolved runtime layout. */
export interface ResolvedColumn<TRow> {
  def: ColumnDef<TRow>
  id: string
  width: number
  minWidth: number
  align: ColumnAlign
  frozen: boolean
  sortable: boolean
  resizable: boolean
  /**
   * Canonical 1-based column position used for `aria-colindex`. Counts every
   * column (frozen first, then scroll) regardless of which window is mounted by
   * horizontal virtualization, so assistive tech always reads a stable index.
   */
  colIndex: number
}

/** Sort metadata surfaced for a header cell. */
export interface ColumnSortInfo {
  direction: SortDirection | null
  /** 1-based position in a multi-sort, or `null` when not part of the sort. */
  priority: number | null
}

/** Everything the presentation layer needs, returned by {@link useDataGrid}. */
export interface DataGridModel<TRow> {
  /** Rows after sorting, in display order. */
  rows: readonly TRow[]
  /** Frozen (left-pinned) columns, in order. */
  frozenColumns: ResolvedColumn<TRow>[]
  /** Scrollable columns, in order. */
  scrollColumns: ResolvedColumn<TRow>[]
  /** All columns (frozen first), in order. */
  columns: ResolvedColumn<TRow>[]
  /** Combined width in px of the frozen layer. */
  frozenWidth: number
  sort: {
    state: SortState<TRow>[]
    toggle: (columnId: string, additive: boolean) => void
    infoFor: (columnId: string) => ColumnSortInfo
  }
  selection: {
    mode: SelectionMode
    selectedKeys: ReadonlySet<string | number>
    isSelected: (key: string | number) => boolean
    toggle: (key: string | number) => void
    toggleAll: () => void
    allSelected: boolean
    someSelected: boolean
    clear: () => void
  }
  resize: {
    /** Begin a pointer-driven resize for a column. */
    start: (columnId: string, startClientX: number) => void
    /** Adjust a column width by a keyboard step (px, may be negative). */
    nudge: (columnId: string, deltaPx: number) => void
    /** Column currently being resized, or `null`. */
    activeColumnId: string | null
  }
  getRowKey: RowKey<TRow>
}

/** Default column width in px when none is declared. */
export const DEFAULT_COLUMN_WIDTH = 160

/** Default minimum column width in px honoured while resizing. */
export const MIN_COLUMN_WIDTH = 64

/**
 * Upper bound announced as the resize slider's `aria-valuemax`. Resizing is not
 * actually capped in code; this is a sane ceiling so assistive tech can frame
 * the current width within a finite range.
 */
export const MAX_COLUMN_WIDTH = 960

/** Default row height in px used for vertical virtualization. */
export const DEFAULT_ROW_HEIGHT = 40

/** Keyboard resize step in px (Arrow keys on a resize handle). */
export const RESIZE_KEYBOARD_STEP = 16
