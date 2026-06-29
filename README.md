# Forge — headless UI kit for data-dense dashboards

> Open-source React component library for the gaps in `shadcn/ui` when building admin dashboards: virtualized DataGrid, advanced grouped Combobox, AND/OR FilterBuilder, MetricCard, KpiGrid, CommandMenu. Published to npm.

[![CI](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Status](https://img.shields.io/badge/status-in_development-orange)

🚧 **Status:** in active development. npm package, Storybook and docs site links will appear here once the first release lands.

---

## EN

### What it is
A focused UI library for the gaps in `shadcn/ui` when building data-dense dashboards: virtualized `DataGrid`, grouped async `Combobox`, AND/OR `FilterBuilder`, `MetricCard` with trend sparkline, `KpiGrid`, `CommandMenu` (⌘K). Shipped as a tree-shakable ESM-only npm package with Storybook, a Nextra docs site, and Changesets-driven releases.

### Stack
Vite (library mode) · TypeScript (strict) · Radix UI primitives · class-variance-authority · Tailwind · @tanstack/react-virtual · Storybook 9 + Test Runner + addon-a11y · Vitest + Testing Library · Changesets · Astro Starlight (docs site) · pnpm workspaces

### Highlights
- Tree-shakable ESM-only build via Vite library mode + `vite-plugin-dts`
- Every component lives in its own folder: `Button.tsx` + `.stories.tsx` + `.test.tsx` + `index.ts`
- All variants via `cva` + `VariantProps` (no manual `className` joins)
- All composability via `asChild` (Radix Slot)
- a11y violations block merge (Storybook addon-a11y + Test Runner in CI)
- Changesets-driven releases — each PR ships its own changelog entry; npm publish automated via GitHub Actions

### Run locally
```bash
pnpm install
pnpm --filter ui build              # build the library to dist/ (ESM + .d.ts)
pnpm --filter storybook dev         # http://localhost:6006
pnpm --filter docs dev              # http://localhost:3000
```

---

## RU

### Что это
Фокусированная UI-библиотека для дыр в `shadcn/ui` при сборке data-dense дашбордов: виртуализированный `DataGrid`, grouped async `Combobox`, AND/OR `FilterBuilder`, `MetricCard` с trend-spark, `KpiGrid`, `CommandMenu` (⌘K). Публикуется как tree-shakable ESM-only npm-пакет со Storybook, Nextra docs-сайтом и Changesets-релизами.

### Стек
Vite (library mode) · TypeScript (strict) · Radix UI primitives · class-variance-authority · Tailwind · @tanstack/react-virtual · Storybook 9 + Test Runner + addon-a11y · Vitest + Testing Library · Changesets · Astro Starlight (docs site) · pnpm workspaces

### Highlights
- Tree-shakable ESM-only build через Vite library mode + `vite-plugin-dts`
- Структура каждого компонента: `Button.tsx` + `.stories.tsx` + `.test.tsx` + `index.ts`
- Все варианты через `cva` + `VariantProps` (никаких ручных `className` склеек)
- Композиция через `asChild` (Radix Slot)
- a11y violations блокируют merge (Storybook addon-a11y + Test Runner в CI)
- Релизы через Changesets — каждый PR несёт changelog-запись; npm publish автоматический через GitHub Actions

### Запуск локально
```bash
pnpm install
pnpm --filter ui build
pnpm --filter storybook dev
pnpm --filter docs dev
```

---

## License
[MIT](LICENSE)
