# FilterBuilder performance

The FilterBuilder is a fully controlled, recursive view over a normalized filter
tree (`{ combinator, rules: (Rule | Group)[] }`). It holds no tree state of its
own — every edit is reported through `onChange`. Its performance rests on three
invariants that keep the cost of an edit proportional to the **branch that
changed**, not the size of the whole tree:

1. **Structural sharing.** The immutable tree ops clone only the groups *along
   the edited path*; every untouched branch keeps its object identity (`===`).
   A sibling rule or a sibling sub-group is the very same object before and after
   an unrelated edit.
2. **Row/group memoisation.** `FilterRule` and `FilterGroup` are wrapped in
   `React.memo`. Their props are engineered to be referentially stable — the
   dispatch object (`actions`) is created once and reads the latest tree from a
   ref, the root path is a single frozen reference, and each child's `path` array
   is memoised on `[path, rules.length]`. So when structural sharing hands an
   untouched row the same `rule` and the same `path`, `memo`'s default shallow
   compare bails the render out.
3. **O(n) serialization.** `serialize` is a single `JSON.stringify` over the
   versioned envelope `{ v: 1, tree }`; `deserialize` is one `JSON.parse` plus a
   linear validating walk. Both are linear in the node count.

Together these mean editing one rule re-renders exactly that one rule row, and
serializing a few-hundred-rule tree stays well under a frame.

## Budgets

| Metric | Budget | How it is measured |
| --- | --- | --- |
| Tree of 200 rules / 20 groups: add / remove / edit | re-render ≤ 16 ms | render-count test + Perf-story harness |
| Re-render isolation | editing one rule does **not** re-render sibling rows | render-count test (per-`field` counter in a stable `renderRule`) |
| Serialize 200 rules | median ≤ 5 ms | `performance.now()` around `serialize`, warm-up + median |
| Deserialize 200 rules | median ≤ 5 ms | `performance.now()` around `deserialize`, warm-up + median |
| Round trip 200 rules | `deserialize(serialize(x))` deep-equals `x` | equality assertion in the perf test |

## Methodology

Two complementary instruments back the budgets.

**jsdom render-count test** —
`packages/ui/src/components/FilterBuilder/FilterBuilder.perf.test.tsx`. It threads
a **stable** `renderRule` that increments a per-`field` counter each time a rule
row renders (the function is called synchronously inside each `FilterRule`, so
its invocation count *is* that row's render count; keeping it stable also avoids
invalidating the builder's `effectiveRenderRule` memo). Two cases:

- **Flat** — a root group with six rules `r0…r5`. After a `fireEvent.change` on
  `r3`, only `r3`'s counter increments; `r0, r1, r2, r4, r5` are unchanged.
- **Nested** — a root rule `a0` beside an `OR` group holding `b0, b1`. Editing
  `b0` increments only `b0`; the sibling rule `b1` and the rule in the other
  branch (`a0`) do not re-render.

Because an untouched row never re-invokes `renderRule`, a flat sibling counter
also proves the row's `update`/`remove` callbacks did not change identity.

The test is not a tautology: it fails if the root path is handed as a fresh `[]`
literal each render (which cascades a re-render through the whole tree) or if the
`React.memo` wrappers are removed.

**`performance.now()` serialize/deserialize test** — the same file builds a tree
of exactly 200 rules across ~20 nested groups (via `makeFilterTree` from
`demo/fixtures.ts`), warms up (5 runs), then takes the median of 10 measurements
of `serialize` and of `deserialize`, asserting each median ≤ 5 ms. A round-trip
`deserialize(serialize(tree))` deep-equality check guards the wire format.

**Perf-story harness** —
`packages/ui/src/components/FilterBuilder/demo/FilterBuilderPerfHarness.tsx`,
surfaced through the untagged `FilterBuilder/Perf` story over a 200-rule tree.
A **Measure isolation** button programmatically edits one leaf rule (through the
same immutable op the UI uses) and reports `{ editedField, rerenderedRows,
totalRows }`; a **Measure serialize** button reports serialize/deserialize
medians. Both write to `window.__filterbuilderPerf` for an external
(Playwright) capture run, mirroring the DataGrid harness. The story is
deliberately **not** tagged `test` — the heavy dataset is a manual measurement
tool, and the budgets above are already proven by the jsdom test.

Per the budget definition, the authoritative timing numbers should be taken from
a **production build** of Storybook (`storybook build`, served statically) driven
by Playwright/Chromium with CPU throttling off, on the reference machine
(M2 / Ryzen 7 7840U class, 16 GB). Dev-server numbers include HMR and unminified
React and are not comparable.

## Recorded numbers

> Status: **indicative run captured; reference-hardware run still recommended.**

The isolation budget is verified automatically in CI via the jsdom render-count
test. The serialize/deserialize medians below come from the same jsdom perf test
(`vitest run`, Node 24 on a commodity Windows laptop).

| Metric | Budget | Measured | Verdict |
| --- | --- | --- | --- |
| Serialize 200 rules (median of 10) | ≤ 5 ms | ~0.02 ms | ✅ within budget |
| Deserialize 200 rules (median of 10) | ≤ 5 ms | ~0.07 ms | ✅ within budget |
| Round trip 200 rules | deep-equal | equal | ✅ |
| Re-render isolation — edit one rule | siblings not re-rendered | 1 rule row re-rendered, 0 siblings | ✅ verified (render-count test) |

**Caveats — read the timing numbers as indicative, not canonical:**

- Captured on a commodity Windows laptop, **not** the reference machine
  (M2 / Ryzen 7 7840U class) the budgets are defined against. Treat them as an
  order-of-magnitude confirmation, not the authoritative figures.
- Serialization is `JSON.stringify`/`JSON.parse` — linear in node count — so the
  ~50–250× headroom under the 5 ms budget is expected and stable; warm-up plus a
  median simply removes JIT and GC jitter from the sample.
- The **re-render isolation result is the robust, fully-verified guarantee**:
  editing one rule re-renders exactly that row and no sibling, asserted in CI by
  counting per-row renders. Before the root-path fix the same test showed all
  siblings re-rendering, so the guard is load-bearing, not decorative.
