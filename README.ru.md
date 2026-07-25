# Forge

React-компоненты для дашбордов с плотными данными — те части, которые универсальные библиотеки оставляют писать самому: виртуализированный DataGrid с закреплёнными колонками, FilterBuilder с вложенными AND/OR-группами, асинхронный Combobox и примитивы вокруг них.

[![npm](https://img.shields.io/npm/v/@sergeyhorse/forge)](https://www.npmjs.com/package/@sergeyhorse/forge)
[![CI](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/sergeyhorse1/forge-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/sergeyhorse1/forge-ui?style=flat)](https://github.com/sergeyhorse1/forge-ui/stargazers)

Сайт документации и Storybook собираются из этого репозитория; ссылки на них появятся здесь после деплоя.

[English version](README.md)

## Установка

```bash
pnpm add @sergeyhorse/forge
pnpm add react react-dom radix-ui
pnpm add date-fns   # опционально, только для DatePicker
```

```tsx
import { Button, DataGrid } from '@sergeyhorse/forge'
import '@sergeyhorse/forge/styles.css'
```

`styles.css` собран заранее: заскоупленный preflight, токены обеих тем и утилиты, которые используют компоненты. Достаточно импортировать его один раз в корне приложения — настраивать Tailwind у себя не нужно. Тёмная тема включается атрибутом, а не медиа-запросом, так что момент переключения выбираете вы:

```js
document.documentElement.dataset.theme = 'dark'
```

Тем, кто уже на Tailwind, — тот же импорт: в Tailwind 4 нет формата JS-пресета, поэтому `@sergeyhorse/forge/preset` отдаёт значения токенов обычными объектами для инструментов, а не как конфиг.

## Что внутри интересного

- **DataGrid с ограниченным DOM.** Строки и колонки виртуализируются через `@tanstack/react-virtual`, закреплённые колонки рисуются отдельным слоем, а не через `position: sticky` — sticky ломается внутри трансформированного контейнера виртуализатора. На ячейках стоят канонические `aria-rowindex` / `aria-colindex`, поэтому скринридер видит реальные позиции, хотя примонтировано только окно. Число узлов в DOM одинаково на 10k и на 100k строк, и это проверяется в CI, а не на глаз.
- **FilterBuilder, который переживает URL.** Полностью контролируемое дерево вложенных AND/OR-групп со schema-driven редакторами для string, number, boolean, date и enum. Сериализация — версионированный конверт, на обратном пути валидируется по ключам каждого узла: фильтр, вставленный из адресной строки, либо разбирается в нормализованное дерево, либо падает с путём до битого узла. Полудоверенного состояния не остаётся. Правка одного правила перерисовывает только это правило — на это есть тест, а не обещание.
- **Доступность держится сборкой.** Каждая стори прогоняется через axe в браузерном режиме Vitest, нарушения настроены валить прогон, так что регрессия ломает CI, а не всплывает на ревью. Цветовые токены подогнаны под контраст 4.5:1 в обеих темах, а отдельный тест парсит стилевой файл и не даёт экспортируемым значениям токенов разъехаться с ним. За 30 компонентами стоят 498 unit-тестов и 130 сторис.

## Компоненты

| Группа           | Компоненты                                                                      |
| ---------------- | ------------------------------------------------------------------------------- |
| Базовые          | Button, IconButton, Badge, Avatar, Card, Spinner, Skeleton, Tooltip             |
| Формы            | Input, Textarea, Select, Checkbox, Radio, Switch, Combobox, DatePicker          |
| Оверлеи          | Dialog, Popover, Sheet, Toast                                                   |
| Данные и дашборд | DataGrid, MetricCard, KpiGrid, EmptyState, Tabs, Accordion, Toolbar, Pagination |
| Продвинутые      | FilterBuilder, CommandMenu                                                      |

Headless-слой тоже экспортируется — `useDataGrid`, `useCombobox`, операции над деревом FilterBuilder и его сериализатор — если нужна логика без нашей разметки.

## Стек

Vite в library mode + `vite-plugin-dts` · TypeScript strict · Tailwind 4 · примитивы Radix UI · `class-variance-authority` · `@tanstack/react-virtual` · Storybook 10 с Vitest-аддоном и addon-a11y · Vitest + Testing Library · Astro Starlight для документации · Changesets · pnpm workspaces

## Запуск локально

Нужен Node `^20.19.0 || >=22.12.0` и pnpm 10.

```bash
pnpm install
pnpm build                      # библиотека → packages/ui/dist (ESM + .d.ts)
pnpm --filter forge-storybook dev     # http://localhost:6006
pnpm --filter docs dev          # http://localhost:4321
```

Проверки — те же, что гоняет CI:

```bash
pnpm lint
pnpm typecheck
pnpm test                       # unit-тесты с порогами покрытия
pnpm test:storybook             # стори-тесты в реальном браузере
```

## Контрибьютинг

Изменение публичного API требует changeset:

```bash
pnpm changeset
```

Релизы автоматические — мердж сгенерированного version-PR публикует пакет в npm.

## Лицензия

[MIT](LICENSE) © Sergey Horse
