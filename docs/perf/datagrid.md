# DataGrid performance

The DataGrid is built around two design invariants that make its cost a
function of the **visible viewport**, not the dataset:

1. **Bounded DOM.** Both axes are virtualized (`@tanstack/react-virtual`), so
   the number of mounted cells is `(visibleRows + overscanRows) ×
   visibleColumns` (plus the frozen overlay, itself `(visibleRows + overscan) ×
   frozenColumns`). It does not grow with row or column count.
2. **No transform on scroll content.** Cells are positioned with absolute
   `top`/`left` rather than a container transform, which keeps the frozen and
   header overlays aligned via cheap scroll sync (see ADR-003).

## Budgets

| Metric | Budget | How it is measured |
| --- | --- | --- |
| Sustained scroll, 10k × 30 | p95 frame ≤ 17 ms (~58 fps); no frame > 32 ms | `Perf10k` story, frame logger over 3 s of programmatic scroll |
| Initial mount (first viewport), 10k × 30 | ≤ 120 ms | `performance.now()` around first commit |
| Re-sort 10k | ≤ 80 ms | `performance.now()` around the sort toggle |
| Column resize drag | ≥ 60 fps, no layout thrash | visual + frame logger during drag |
| Mounted DOM nodes | ≤ (visibleRows + overscan) × cols; constant in dataset size | `document.querySelectorAll('[role="gridcell"]')` in the story play function |
| Stress ceiling | 100k × 30 still ≥ 50 fps scroll | `Perf100k` story, frame logger |

## Methodology

Measurements use the two perf stories in
`packages/ui/src/components/DataGrid/DataGrid.stories.tsx`:

- **`Perf10k`** — 10 000 rows × 30 columns (2 frozen).
- **`Perf100k`** — 100 000 rows × 30 columns (2 frozen).

Each is wrapped in `PerfHarness`, which exposes a **Measure scroll** button. On
press it programmatically scrolls the viewport up and down for 3 seconds while
sampling `requestAnimationFrame` deltas, then reports `frames`, `p50`, `p95`,
`max`, the count of frames over 32 ms, and an estimated fps. The same summary is
written to `window.__datagridPerf` for automated capture.

Per the budget definition, the authoritative numbers must be taken from a
**production build** of Storybook (`storybook build`, served statically) driven
by Playwright/Chromium with CPU throttling off, on the reference machine
(M2 / Ryzen 7 7840U class, 16 GB). Dev-server numbers include HMR and unminified
React and are not comparable.

The bounded-DOM invariant is additionally asserted automatically: the `Default`
and `Perf10k` story play functions count `[role="gridcell"]` nodes and fail if
the count exceeds `(visibleRows + overscan) × columns`. This guards against a
regression that would re-introduce dataset-proportional rendering, independent
of the timing run.

## Recorded numbers

> Status: **pending a dedicated production-build measurement run.**

The bounded-DOM budget is verified automatically in CI via the story play
functions (cell count stays within the visible-window bound at 10k rows). The
timing budgets (p95 frame, initial mount, re-sort, drag fps, 100k scroll fps)
require a production Storybook build driven by Playwright on the reference
machine and have not yet been captured here. The instrumentation
(`PerfHarness`, `window.__datagridPerf`) is in place; this section is to be
filled in from that run.

| Metric | Budget | Measured |
| --- | --- | --- |
| Sustained scroll, 10k × 30 (p95 frame) | ≤ 17 ms | _pending run_ |
| Sustained scroll, 10k × 30 (max frame) | ≤ 32 ms | _pending run_ |
| Initial mount, 10k × 30 | ≤ 120 ms | _pending run_ |
| Re-sort 10k | ≤ 80 ms | _pending run_ |
| Column resize drag | ≥ 60 fps | _pending run_ |
| Mounted DOM nodes | bounded by viewport | **verified** (play function) |
| 100k × 30 scroll | ≥ 50 fps | _pending run_ |
