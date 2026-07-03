import { useMemo } from 'react'
import { expect, userEvent, within } from 'storybook/test'

import type { Meta, StoryObj } from '@storybook/react-vite'

import { DataGrid, type DataGridProps } from './DataGrid'
import {
  demoColumns,
  getRowKey,
  makePerfColumns,
  makeRows,
  type DemoRow,
} from './demo/fixtures'
import { PerfHarness } from './demo/PerfHarness'

const meta = {
  title: 'Data/DataGrid',
  component: DataGrid<DemoRow>,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DataGrid<DemoRow>>

export default meta

type Story = StoryObj<typeof meta>

const SMALL_ROWS = makeRows(500, 0)

export const Default: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 420,
  },
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole('grid')
    await expect(grid).toBeInTheDocument()

    // Монтируется только видимое окно (плюс overscan), не весь датасет.
    const renderedCells = canvasElement.querySelectorAll('[role="gridcell"]')
    const visibleRows = Math.ceil(420 / 40) + 8 /* overscanRows */ + 1
    const maxCells = visibleRows * demoColumns.length
    await expect(renderedCells.length).toBeGreaterThan(0)
    await expect(renderedCells.length).toBeLessThanOrEqual(maxCells)
  },
}

export const FrozenColumns: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    // Первые два столбца frozen: два columnheader'а — в статичном углу, остальные
    // в скролл-слое.
    const headers = canvasElement.querySelectorAll('[role="columnheader"]')
    await expect(headers.length).toBeGreaterThanOrEqual(demoColumns.length)

    // Регрессия: frozen-ячейки одной строки должны лечь слева направо без нахлёста.
    // Оверлей рисует их как aria-hidden presentation-боксы; у первой строки данных
    // их bounding-боксы должны иметь строго растущие left и не пересекаться по
    // горизонтали (прежний баг стекал их все на один x). Ловится только в реальном
    // браузере, где layout действительно считается.
    const overlay = canvasElement.querySelector(
      '[aria-hidden="true"] [role="presentation"]',
    )?.parentElement as HTMLElement
    const firstRowCells = Array.from(
      overlay.querySelectorAll<HTMLElement>('[role="presentation"]'),
    )
    await expect(firstRowCells.length).toBe(2)

    const rects = firstRowCells.map((cell) => cell.getBoundingClientRect())
    for (let i = 1; i < rects.length; i += 1) {
      const previous = rects[i - 1]!
      const current = rects[i]!
      // Каждая следующая frozen-ячейка начинается на/после конца предыдущей.
      await expect(current.left).toBeGreaterThanOrEqual(previous.right)
      // И имеет реальную ширину, т.е. не схлопнута на соседа.
      await expect(current.width).toBeGreaterThan(0)
    }

    // Вертикальная обрезка: скролл-слой виртуализирует окно плюс overscan, его
    // rowgroup куда выше тела. Overscan-строки должны обрезаться по боксу сетки и
    // не рисоваться ниже её края. Одного bounding rect мало — обрезанная ячейка всё
    // равно рапортует rect вне скролл-предка — поэтому хит-тестим точку чуть ниже
    // сетки: если там что-то из сетки нарисовано, обрезка сломалась. (При прежнем
    // overflow:visible тут попадался gridcell.)
    const grid = canvasElement.querySelector('[role="grid"]') as HTMLElement
    const gridRect = grid.getBoundingClientRect()
    const belowGrid = document.elementFromPoint(
      gridRect.left + gridRect.width / 2,
      gridRect.bottom + 30,
    )
    // Ниже нижнего края сетки не должно рисоваться ничего её. null (фон страницы) —
    // ок; попадание, которое сетка содержит, — протечка.
    const leaked = belowGrid !== null && grid.contains(belowGrid)
    await expect(leaked).toBe(false)
  },
}

// Достаёт alpha из rgb()/rgba() (по умолчанию 1).
function alphaOf(color: string): number {
  const match = color.match(/^rgba?\(([^)]+)\)$/)
  if (!match) return 1
  const parts = match[1]!.split(',').map((value) => value.trim())
  return parts.length === 4 ? Number(parts[3]) : 1
}

export const HorizontalScrollOcclusion: Story = {
  name: 'Horizontal scroll occlusion',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    // Узкая сетка делает scroll-столбцы шире вьюпорта, так что горизонтальный
    // скролл реально уводит контент под frozen-оверлей.
    className: 'w-[420px]',
  },
  play: async ({ canvasElement }) => {
    const scroller = canvasElement.querySelector('.overflow-auto') as HTMLElement

    // Реальный горизонтальный скролл заметно за frozen-ширину, чтобы Email уехал
    // под frozen Name/ID. (Frozen — 80 + 200 = 280px; 400 уводит явно за него.)
    scroller.scrollLeft = 400
    scroller.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await expect(scroller.scrollLeft).toBeGreaterThan(0)

    // Окклюзия (paint). Оверлей висит над проскролленным телом, его строки по
    // умолчанию прозрачны — он скроет уехавший под него текст Email только если фон
    // контейнера НЕПРОЗРАЧЕН. Ровно эта регрессия: background-color контейнера был
    // rgba(0,0,0,0), и email просвечивал. alpha < 1 здесь = контент просвечивает,
    // так что ассерт load-bearing и падал бы на старом поведении.
    const presentationCell = canvasElement.querySelector(
      '[aria-hidden="true"] [role="presentation"]',
    ) as HTMLElement
    // presentation-ячейка -> строка -> контейнер оверлея (его и заливаем).
    const overlay = presentationCell.parentElement!.parentElement as HTMLElement
    const overlayBg = getComputedStyle(overlay).backgroundColor
    await expect(alphaOf(overlayBg)).toBe(1)

    // Окклюзия (stacking). Оверлей должен и лежать поверх скролл-тела в той же
    // точке, чтобы непрозрачная заливка реально накрывала уехавшую ячейку, а не
    // рисовалась за ней. Пробим точку внутри frozen-ширины над первой строкой:
    // попасть должна presentation-ячейка оверлея, а не gridcell тела с текстом Email.
    const overlayRect = overlay.getBoundingClientRect()
    const cellRect = presentationCell.getBoundingClientRect()
    const hit = document.elementFromPoint(
      overlayRect.left + overlayRect.width - 10,
      cellRect.top + cellRect.height / 2,
    ) as HTMLElement | null
    await expect(hit).not.toBeNull()
    const overlayContainer = presentationCell.closest(
      '[aria-hidden="true"]',
    ) as HTMLElement
    await expect(overlayContainer.contains(hit)).toBe(true)
    await expect(hit!.closest('[role="gridcell"]')).toBeNull()

    // Угол шапки: frozen-угол тоже должен быть непрозрачным, чтобы уезжающие под
    // него ячейки шапки не просвечивали.
    const corner = canvasElement.querySelector(
      '[role="row"][aria-rowindex="1"] > div',
    ) as HTMLElement
    await expect(alphaOf(getComputedStyle(corner).backgroundColor)).toBe(1)
    const cornerRect = corner.getBoundingClientRect()
    const headerHit = document.elementFromPoint(
      cornerRect.left + cornerRect.width - 10,
      cornerRect.top + cornerRect.height / 2,
    ) as HTMLElement | null
    await expect(headerHit).not.toBeNull()
    const hitHeader = headerHit!.closest('[role="columnheader"]') as HTMLElement
    await expect(hitHeader).not.toBeNull()
    await expect(corner.contains(hitHeader)).toBe(true)
  },
}

export const MultiSort: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    sort: { multiSort: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const headerFor = (label: string) =>
      canvas.getByText(label).closest('[role="columnheader"]') as HTMLElement

    // Активация сортируемой шапки с клавиатуры прокручивает её в ascending.
    headerFor('Team').focus()
    await userEvent.keyboard('{Enter}')
    await expect(headerFor('Team')).toHaveAttribute('aria-sort', 'ascending')

    // Shift+Enter на второй шапке добавляет её в multi-sort.
    headerFor('Score').focus()
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await expect(headerFor('Score')).toHaveAttribute('aria-sort', 'ascending')
    await expect(headerFor('Team')).toHaveAttribute('aria-sort', 'ascending')
  },
}

export const SelectableRows: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    const grid = within(canvasElement).getByRole('grid')
    await expect(grid).toHaveAttribute('aria-multiselectable', 'true')

    const firstRow = canvasElement.querySelector(
      '.overflow-auto [role="row"]',
    ) as HTMLElement
    await userEvent.click(firstRow)
    await expect(firstRow).toHaveAttribute('aria-selected', 'true')
  },
}

export const KeyboardSelection: Story = {
  name: 'Keyboard selection',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    // Roving tabindex: фокусим первую body-ячейку (единственный таб-стоп), шаг вниз
    // стрелками, затем тоггл выделения строки через Enter — целиком с клавиатуры.
    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )

    const firstCell = cellAt(2, 1)!
    await expect(firstCell).toBeInTheDocument()
    firstCell.focus()
    await expect(firstCell).toHaveAttribute('tabindex', '0')

    await userEvent.keyboard('{ArrowDown}{ArrowRight}')

    const movedCell = cellAt(3, 2)
    await expect(movedCell).toHaveFocus()
    await expect(movedCell).toHaveAttribute('tabindex', '0')

    await userEvent.keyboard('{Enter}')
    const selectedRow = movedCell!.closest('[role="row"]') as HTMLElement
    await expect(selectedRow).toHaveAttribute('aria-selected', 'true')

    // Нетронутая первая строка остаётся невыделенной.
    const firstRow = firstCell.closest('[role="row"]') as HTMLElement
    await expect(firstRow).toHaveAttribute('aria-selected', 'false')
  },
}

export const FocusIndicators: Story = {
  name: 'Focus indicators',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    const hasVisibleRing = (element: HTMLElement) => {
      const style = getComputedStyle(element)
      // ring-* Tailwind рендерятся как box-shadow; реальный outline тоже считается.
      // Любой из них не-none доказывает видимый индикатор фокуса.
      return (
        (style.boxShadow !== '' && style.boxShadow !== 'none') ||
        (style.outlineStyle !== '' && style.outlineStyle !== 'none')
      )
    }

    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )!

    // Входим в сетку на первой frozen-ячейке, затем стрелкой в первый scroll-столбец
    // (colindex 3). Ход с клавиатуры включает :focus-visible, и ring реально рисуется.
    const firstCell = cellAt(2, 1)
    firstCell.focus()
    await userEvent.keyboard('{End}')

    const scrollCell = cellAt(2, demoColumns.length)
    await expect(scrollCell).toHaveFocus()
    await expect(hasVisibleRing(scrollCell)).toBe(true)

    // Настоящая gridcell frozen-столбца обрезана за кадром, её ring зеркалится на
    // видимую ячейку оверлея. Возвращаемся на первый frozen-столбец (colindex 1) и
    // проверяем, что ячейка оверлея показывает ring.
    await userEvent.keyboard('{Home}')
    const frozenReal = cellAt(2, 1)
    await expect(frozenReal).toHaveFocus()

    const overlayCell = canvasElement.querySelector<HTMLElement>(
      '[aria-hidden="true"] [role="presentation"]',
    )!
    await expect(hasVisibleRing(overlayCell)).toBe(true)
  },
}

export const FocusSurvivesScroll: Story = {
  name: 'Focus survives mouse scroll',
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 240,
    selection: { mode: 'multi' },
  },
  play: async ({ canvasElement }) => {
    const viewport = canvasElement.querySelector('.overflow-auto') as HTMLElement
    const cellAt = (rowIndex: number, colIndex: number) =>
      canvasElement.querySelector<HTMLElement>(
        `.overflow-auto [role="gridcell"][aria-rowindex="${rowIndex}"][aria-colindex="${colIndex}"]`,
      )

    // Фокусим первую body-ячейку (первый scroll-столбец = colindex 3).
    const firstCell = cellAt(2, 3)!
    firstCell.focus()
    await expect(firstCell).toHaveFocus()

    // Скроллим мышью далеко за видимое окно. Сфокусированную ячейку обычно
    // виртуализировало бы, слетел бы фокус; пиннинг активной строки держит её
    // смонтированной — фокус и стрелочная навигация переживают скролл.
    viewport.scrollTop = 4000
    viewport.dispatchEvent(new Event('scroll'))
    await new Promise((resolve) => requestAnimationFrame(resolve))

    // Активная ячейка всё ещё смонтирована и в фокусе, несмотря на скролл.
    await expect(cellAt(2, 3)).toBeInTheDocument()
    await expect(cellAt(2, 3)).toHaveFocus()

    // Стрелки всё ещё водят от (восстановленной) активной ячейки.
    await userEvent.keyboard('{ArrowDown}')
    await expect(cellAt(3, 3)).toHaveFocus()
  },
}

export const ResizableColumns: Story = {
  tags: ['test'],
  args: {
    rows: SMALL_ROWS,
    columns: demoColumns,
    getRowKey,
    height: 360,
  },
  play: async ({ canvasElement }) => {
    const handle = canvasElement.querySelector(
      '[role="separator"][aria-orientation="vertical"]',
    ) as HTMLElement
    await expect(handle).toBeInTheDocument()
    handle.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    // Клавиатурный ресайз отработал; ручка держит фокус для следующего nudge.
    await expect(handle).toHaveFocus()
  },
}

const PERF_COLUMNS = makePerfColumns()

// Большой датасет генерим лениво внутри компонента, а не при загрузке модуля, —
// чтобы простой импорт файла для индексации/тестов не аллоцировал миллионы объектов.
function PerfGrid({
  rowCount,
  ...args
}: { rowCount: number } & Omit<DataGridProps<DemoRow>, 'rows' | 'columns' | 'getRowKey'>) {
  const rows = useMemo(() => makeRows(rowCount, 26), [rowCount])
  return (
    <PerfHarness>
      <DataGrid rows={rows} columns={PERF_COLUMNS} getRowKey={getRowKey} {...args} />
    </PerfHarness>
  )
}

// render поставляет свои данные; эти args лишь удовлетворяют обязательные типы
// пропсов, не аллоцируя датасет при загрузке модуля.
const placeholderArgs = {
  rows: [] as DemoRow[],
  columns: PERF_COLUMNS,
  getRowKey,
}

export const Perf10k: Story = {
  name: 'Perf10k (10k × 30)',
  tags: ['test'],
  args: placeholderArgs,
  render: () => <PerfGrid rowCount={10_000} height={600} />,
  play: async ({ canvasElement }) => {
    // Число DOM-узлов остаётся в рамках видимого окна даже на 10k строк.
    const cells = canvasElement.querySelectorAll('[role="gridcell"]')
    const visibleRows = Math.ceil(600 / 40) + 8 + 1
    const maxCells = visibleRows * PERF_COLUMNS.length
    await expect(cells.length).toBeLessThanOrEqual(maxCells)
    await expect(cells.length).toBeGreaterThan(0)
  },
}

export const Perf100k: Story = {
  name: 'Perf100k (100k × 30)',
  args: placeholderArgs,
  render: () => <PerfGrid rowCount={100_000} height={600} />,
}
