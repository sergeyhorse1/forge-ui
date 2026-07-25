# @sergeyhorse/forge

React components for data-dense dashboards: a virtualized DataGrid, a nested AND/OR FilterBuilder, an async Combobox, and the surrounding set of primitives, form controls and overlays.

Repository and full documentation: [sergeyhorse1/forge-ui](https://github.com/sergeyhorse1/forge-ui).

## Install

```bash
pnpm add @sergeyhorse/forge
```

Peer dependencies:

```bash
pnpm add react react-dom radix-ui
pnpm add date-fns   # optional, only if you use DatePicker
```

## Usage

```tsx
import { Button, MetricCard } from '@sergeyhorse/forge'
import '@sergeyhorse/forge/styles.css'

export function App() {
  return (
    <div>
      <MetricCard title="Revenue" value="$12,400" delta={4.2} />
      <Button variant="solid">Run report</Button>
    </div>
  )
}
```

`styles.css` is a prebuilt stylesheet — a scoped preflight, the theme tokens for both colour schemes, and the utilities the components rely on. Import it once at the root of your app. No Tailwind setup is required to use the library.

Dark mode is opt-in through a `data-theme` attribute on any ancestor:

```js
document.documentElement.dataset.theme = 'dark'
```

The `@sergeyhorse/forge/preset` entry point exports the same token values as plain JavaScript objects (`lightTokens`, `darkTokens`, `darkSelector`) for tooling that needs to read them programmatically. Tailwind 4 has no JS preset format, so it is not a Tailwind config — Tailwind users also import `styles.css`.

## Notes

- ESM only. `sideEffects` is limited to `*.css`, so unused components are dropped by any bundler that honours it.
- Types ship with the package; no `@types/*` needed.
- Requires Node `^20.19.0 || >=22.12.0` to build from source.

## License

MIT © Sergey Horse
