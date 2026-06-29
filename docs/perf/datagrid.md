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

> Status: **indicative run captured; reference-hardware run still recommended.**

The bounded-DOM budget is verified automatically in CI via the story play
functions (cell count stays within the visible-window bound at 10k and 100k
rows). The timing budgets below were captured from a **production Storybook
build** (`storybook build`, served statically) driven by Playwright/Chromium via
the `PerfHarness` / `window.__datagridPerf` instrumentation.

| Metric | Budget | Measured | Verdict |
| --- | --- | --- | --- |
| Sustained scroll, 10k × 30 (p95 frame) | ≤ 17 ms | ~16.7 ms | ✅ within budget |
| Sustained scroll, 10k × 30 (max frame) | ≤ 32 ms | ~16.8 ms (0 frames > 32 ms) | ✅ |
| Initial mount, 10k × 30 | ≤ 120 ms | ~113 ms | ✅ |
| Re-sort 10k | ≤ 80 ms | ~18 ms | ✅ |
| Mounted DOM nodes | bounded by viewport | constant at 10k and 100k (≈ window × cols) | ✅ verified (play function) |
| 100k × 30 scroll | ≥ 50 fps | ~60 fps (p95 16.8 ms, 0 > 32 ms) | ✅ within budget |
| Column resize drag | ≥ 60 fps | not measured (no automated drag harness) | ⬜ pending |

**Caveats — read the numbers as indicative, not canonical:**

- Captured on a commodity Windows laptop, **not** the reference machine
  (M2 / Ryzen 7 7840U class) the budgets are defined against. Treat them as an
  order-of-magnitude confirmation, not the authoritative figures.
- The harness scrolls the viewport programmatically once per
  `requestAnimationFrame`, so the sampled deltas track rAF cadence under driven
  scroll rather than input-driven jank; the ~60 fps / ~16.7 ms figures are
  therefore vsync-pinned and idealized. A wheel-event-driven or CPU-throttled
  variant would yield a stricter jank number.
- The **bounded-DOM invariant is the robust, fully-verified result**: cell count
  stays within the visible-window bound and is identical at 10k and 100k rows,
  proving cost is viewport- not dataset-bound. This is asserted in CI.
