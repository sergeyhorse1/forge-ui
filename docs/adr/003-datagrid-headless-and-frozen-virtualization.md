# ADR-003: DataGrid — own headless engine and frozen-column virtualization

## Status

Accepted

## Context

The DataGrid is the most demanding component in the library: it must render
100k rows × 30 columns at interactive frame rates, support multi-sort,
selection and column resize, and pin columns to the left edge while a sticky
header stays in view. Two structural questions had to be settled before writing
any rendering code.

1. **Where does the table logic come from?** A mature option exists
   (`@tanstack/react-table`). It is powerful but adds a large peer with its own
   API surface, opinions about column models, and a learning cost — most of
   which we would re-wrap to expose our own public API anyway.

2. **How do frozen columns coexist with virtualization?** Horizontal
   virtualization positions cells with `left`/`transform` inside a sized inner
   container. `position: sticky` on a "frozen" cell resolves its sticky offset
   against the nearest scroll container, but once that cell lives inside a
   transformed/positioned virtualization container the sticky anchor is wrong (a
   `transform` establishes a new containing block), so frozen columns drift,
   overlap, or detach during scroll. This is a well-known failure mode.

## Decision

### Own minimal headless engine, no `@tanstack/react-table`

`useDataGrid` is written in-house. It owns sort, selection and resize state and
returns a normalised, render-agnostic model. Rationale:

- Full control over the public API (`ColumnDef`, `DataGridProps`) with no
  leaked third-party concepts.
- One fewer heavyweight peer; virtualization already requires
  `@tanstack/react-virtual`, which is the only mandatory data-grid dependency.
- The logic we need (stable multi-key sort, set-based selection, clamped
  resize) is small and directly unit-testable without a browser.

The engine is split into cohesive sub-hooks — `useSort`, `useSelection`,
`useColumnResize` — composed by `useDataGrid`. Each is independently testable
and stays well under the file-size budget.

### Frozen columns are a separate static layer, not `position: sticky`

Rather than fight sticky inside the virtualized container, frozen (left-pinned)
columns render as a **separate, horizontally static overlay** on top of the
scroll viewport. The layout is four quadrants sharing one set of
virtualizer-derived measurements:

| | Frozen (static X) | Scrollable (virtualized X) |
| --- | --- | --- |
| **Header (static Y)** | static corner | offset by `-scrollLeft` |
| **Body (virtualized Y)** | offset by `-scrollTop` | the scroll viewport |

- A single scroll viewport (`overflow: auto`) drives **both** the row and the
  column virtualizer.
- The frozen body overlay reuses the **same row virtualizer** (so vertical
  windowing is identical) and is offset by `translateY(-scrollTop)` on each
  scroll event to mirror the viewport.
- The scroll header is offset by `translateX(-scrollLeft)`; the frozen header
  corner never moves.
- Both axes of the virtualizer run in **`position` mode** (absolute
  `top`/`left`), never `transform` mode, on the scroll content. A transform on
  the inner container would create a containing block and reintroduce exactly
  the sticky/offset bug we are avoiding for the overlays.

This keeps frozen columns rock-steady horizontally and perfectly aligned
vertically, while still mounting only the visible window of cells on every axis.

### Accessibility rides on the canonical cells, not the overlay

Two decisions follow directly from the quadrant model:

- **Keyboard navigation (WAI-ARIA `grid`).** Focus and arrow-key movement run a
  roving tabindex over the **canonical** gridcells inside the scroll rows — the
  same cells that carry the `gridcell` role, including the off-screen (clipped)
  frozen cells. The visual frozen overlay stays `aria-hidden`/`presentation` and
  is never a focus target. Because navigation may target a cell outside the
  mounted window, a move scrolls the relevant virtualizer first, then focuses
  the cell once it has rendered (a one-shot deferred focus). The header keeps its
  own independent tab stops (sortable headers, resize separators).
- **`aria-colindex` is canonical, not windowed.** Horizontal virtualization
  mounts only a slice of columns, so a mounted cell's DOM position does not equal
  its logical column. Every `gridcell`/`columnheader` therefore carries an
  explicit 1-based `aria-colindex` assigned in the canonical order (frozen
  columns first, then scroll columns), matching `aria-colcount`. Cells also
  mirror `aria-rowindex`, which lets navigation address a cell by `(row, col)`
  across windows.

### Package structure is an intentional multi-file exception

The shared convention for simple components is a four-file folder. The DataGrid
deliberately deviates: a headless engine plus presentation quadrants cannot be
expressed cohesively in four files without producing oversized, mixed-concern
modules. The folder therefore contains the headless hooks, a thin
`DataGrid.tsx` orchestrator, and small per-quadrant presentation components,
each with a single responsibility and each under the size budget. Styling still
goes exclusively through `cva` + `cn`; no manual `className` concatenation.

## Consequences

- We maintain our own sort/selection/resize logic. It is small, covered by unit
  tests, and the cost is bounded.
- Scroll synchronization for the frozen/header overlays happens in a React
  state update on the `scroll` event. This is cheap (two number writes) and the
  overlays use plain `transform: translate`, which the compositor handles
  without layout.
- Adding right-pinned columns later means adding a fourth pin layer with the
  same pattern; the quadrant model generalizes.
- Because frozen cells are duplicated into an overlay rather than reusing the
  scroll DOM, the bounded node-count budget counts frozen and scroll cells
  separately; both remain a function of the visible window, not the dataset.
