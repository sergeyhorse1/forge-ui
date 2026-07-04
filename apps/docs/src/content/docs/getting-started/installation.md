---
title: Installation
description: Install Forge UI and wire up the stylesheet.
---

Forge UI is distributed as a single ESM package with React as a peer
dependency.

## Install

```bash
pnpm add @sergeyhorse/forge
```

React 19 (or newer) must be present in your project.

## Import the stylesheet

The package ships a pre-built stylesheet with the design tokens and component
utilities. Import it once, at the root of your app:

```ts
import '@sergeyhorse/forge/styles.css'
```

## Use a component

```tsx
import { Button } from '@sergeyhorse/forge'

export function App() {
  return <Button>Get started</Button>
}
```

## Dark mode

Every token has a dark variant. Opt in by setting `data-theme="dark"` on (or
above) the element tree — for example on the `<html>` element:

```html
<html data-theme="dark"></html>
```
