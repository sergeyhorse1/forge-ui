# ADR-006: ESM-only build with externalized peer dependencies

## Status

Accepted

## Context

`@sergeyhorse/forge` is a React component library consumed by application
bundlers (Vite, Next.js, Rspack, etc.). Two distribution questions need a firm
decision before any component lands:

1. **Module format.** Modern consumers run a bundler that understands ESM and
   performs tree-shaking. Shipping a dual CJS/ESM build doubles artifact size,
   invites the "dual package hazard" (two copies of the same module identity in
   one process), and complicates the `exports` map.

2. **Peer dependencies.** React, `react-dom`, `lucide-react` and `date-fns` must
   never be bundled into `dist`. If they were, a consumer could end up with two
   React copies (broken hooks) or a duplicated icon set (bloat). These have to
   stay as runtime `import` statements resolved from the consumer's own
   `node_modules`.

## Decision

- **ESM only.** Vite library mode is configured with `formats: ['es']`. No CJS
  output, no UMD.
- **Tree-shakable, per-file output.** `rollupOptions.output.preserveModules: true`
  with `preserveModulesRoot: 'src'` emits one `.js` per source module instead of
  a single concatenated bundle, so consumers only pull in what they import.
- **`sideEffects` is restricted to CSS.** `package.json` declares
  `"sideEffects": ["*.css"]`. Everything else is side-effect free, enabling
  aggressive dead-code elimination downstream. CSS must stay listed or the
  prebuilt stylesheet would be tree-shaken away.
- **Peers are external.** All peer dependencies are listed both in
  `peerDependencies` and in `rollupOptions.external`. The external matcher uses
  regular expressions (`/^react($|\/)/`, `/^react-dom($|\/)/`, `/^radix-ui($|\/)/`,
  `/^date-fns\//`) so that scoped subpath imports — including the unified
  `radix-ui` package and its subpaths — are also kept external, not just the
  bare specifiers.
- **Types are generated, never hand-written.** `vite-plugin-dts` emits the
  `.d.ts` files. The `types`/`exports` entries in `package.json` point at the
  generated declarations.

## Consequences

- Consumers on legacy CJS-only setups are not supported. This is acceptable for
  a 2026-era library; the target audience uses ESM-capable bundlers.
- A duplicated React/icon set in the final app is structurally impossible from
  this package's side, because those modules are never present in `dist`.
- The `exports` map stays simple: one `import` condition per entry, plus the
  prebuilt `styles.css`.
- Anyone adding a new peer must update both `peerDependencies` and the
  `external` matcher, or the dependency will be silently bundled. This is
  covered by the build check that asserts no peer symbols appear in `dist`.

## Notes on tooling versions

`vite-plugin-dts` 5.x delegates declaration bundling to `unplugin-dts`, where the
single-file rollup option is named `bundleTypes` (the earlier `rollupTypes`
option no longer exists). The config uses `bundleTypes: true`, which relies on
`@microsoft/api-extractor` to merge declarations into a single `index.d.ts`.
