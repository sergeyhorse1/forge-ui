# Forge

React components for data-dense dashboards — the parts a generic component library leaves you to build yourself: a virtualized DataGrid with frozen columns, a nested AND/OR FilterBuilder, an async Combobox, and the primitives around them.

[![npm](https://img.shields.io/npm/v/@sergeyhorse/forge)](https://www.npmjs.com/package/@sergeyhorse/forge)
[![CI](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/sergeyhorse1/forge-ui?style=flat)](https://github.com/sergeyhorse1/forge-ui/stargazers)

**[Documentation](https://sergeyhorse1.github.io/forge-ui/)** · **[Storybook](https://sergeyhorse1.github.io/forge-ui/storybook/)** · **[npm](https://www.npmjs.com/package/@sergeyhorse/forge)**

<!-- hero capture (DataGrid + FilterBuilder) goes here -->

[Русская версия](README.ru.md)

## Install

```bash
pnpm add @sergeyhorse/forge
pnpm add react react-dom radix-ui
pnpm add date-fns   # optional, only for DatePicker
```

```tsx
import { Button, DataGrid } from '@sergeyhorse/forge'
import '@sergeyhorse/forge/styles.css'
```

`styles.css` is prebuilt — a scoped preflight, theme tokens for both colour schemes, and the utilities the components use. Import it once at the root; the library needs no Tailwind setup on your side. Dark mode is an attribute, not a media query, so you decide when it flips:

```js
document.documentElement.dataset.theme = 'dark'
```

Tailwind users import the same stylesheet: Tailwind 4 dropped the JS preset format, so `@sergeyhorse/forge/preset` exports the token values as plain objects for tooling rather than as a config.

## Highlights

- **DataGrid that stays bounded.** Rows and columns are both virtualized through `@tanstack/react-virtual`, and frozen columns render as a separate layer instead of `position: sticky` — sticky breaks inside a transformed virtual container. Cells carry canonical `aria-rowindex` / `aria-colindex`, so assistive tech reads true positions while only the viewport is mounted. The mounted node count stays flat from 10k to 100k rows, and that invariant is asserted in CI rather than eyeballed.
- **FilterBuilder built for round-tripping.** A fully controlled nested AND/OR tree with schema-driven editors for string, number, boolean, date and enum fields. Serialization is a versioned envelope validated key-by-key on the way back in, so a filter pasted from a URL either parses into a normalized tree or throws with the path to the bad node — no half-trusted state. Editing one rule re-renders that rule and nothing else, which is a test rather than a claim.
- **Accessibility enforced by the build.** Every story runs through axe in Storybook's Vitest browser mode with violations configured to fail, so a regression breaks CI instead of surfacing in review. Colour tokens are tuned to hold a 4.5:1 contrast ratio in both themes, and a test parses the stylesheet to keep the exported token values from drifting away from it. 498 unit tests and 130 stories back the 30 components.

## Components

| Group            | Components                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| Base             | Button, IconButton, Badge, Avatar, Card, Spinner, Skeleton, Tooltip             |
| Forms            | Input, Textarea, Select, Checkbox, Radio, Switch, Combobox, DatePicker          |
| Overlays         | Dialog, Popover, Sheet, Toast                                                   |
| Data & dashboard | DataGrid, MetricCard, KpiGrid, EmptyState, Tabs, Accordion, Toolbar, Pagination |
| Advanced         | FilterBuilder, CommandMenu                                                      |

The headless pieces are exported too — `useDataGrid`, `useCombobox`, the FilterBuilder tree operations and its serializer — if you want the behaviour without the markup.

## Stack

Vite library mode + `vite-plugin-dts` · TypeScript strict · Tailwind 4 · Radix UI primitives · `class-variance-authority` · `@tanstack/react-virtual` · Storybook 10 with the Vitest addon and addon-a11y · Vitest + Testing Library · Astro Starlight for the docs site · Changesets · pnpm workspaces

## Run locally

Requires Node `^20.19.0 || >=22.12.0` and pnpm 10.

```bash
pnpm install
pnpm build                      # library → packages/ui/dist (ESM + .d.ts)
pnpm --filter forge-storybook dev     # http://localhost:6006
pnpm --filter docs dev          # http://localhost:4321
```

Checks, the same ones CI runs:

```bash
pnpm lint
pnpm typecheck
pnpm test                       # unit tests, with coverage thresholds
pnpm test:storybook             # story tests in a real browser
```

## Contributing

Changes to the public API need a changeset:

```bash
pnpm changeset
```

Releases are automated — merging the generated version pull request publishes to npm.

## License

[MIT](LICENSE) © Sergey Horse
