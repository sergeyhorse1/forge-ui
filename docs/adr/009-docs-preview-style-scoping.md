# ADR-009: Scoping component styles inside the documentation site

## Status

Accepted

## Context

The documentation site (Astro Starlight) renders live, interactive examples of
the components as React islands. Two requirements pull in opposite directions:

1. **Fidelity.** A component in the docs must look byte-for-byte identical to the
   same component in Storybook — same tokens, same spacing, same borders. There
   must be no second source of token values to drift out of sync.
2. **Isolation.** The shipped stylesheet (`@sergeyhorse/forge/styles.css`) bundles
   Tailwind's global preflight. Importing it as-is resets Starlight's own
   typography (heading sizes, list markers, table borders) across the whole docs
   site.

Naively importing the prebuilt stylesheet satisfies fidelity but breaks
isolation. The reverse — hand-porting token values into the docs — satisfies
isolation but creates a second source of truth.

## Decision

- **Extract the tokens into `packages/ui/src/styles/tokens.css`.** The `@theme`
  block, the `@variant dark` definition and the `[data-theme='dark']` overrides
  moved out of `globals.css` into `tokens.css`, which `globals.css` now imports.
  The compiled `dist/styles.css` is byte-identical, and the docs site imports the
  same file, so token values are authored exactly once.
- **Recompile utilities in the docs instead of importing the prebuilt CSS.** The
  docs stylesheet (`apps/docs/src/styles/forge.css`) imports Tailwind's theme and
  `tokens.css`, then compiles the utility classes from the component sources via
  `@source`. Tokens and utilities are emitted globally, which is harmless: custom
  properties and unused utility classes never affect the surrounding docs.
- **Confine the preflight to `.forge-preview`.** The component-relevant preflight
  rules (box model, border reset, form-control normalization, list/heading reset)
  live in `forge-reset.css`, scoped to a `.forge-preview` wrapper that every
  example is rendered inside. The scope uses `:where(.forge-preview)` so it adds
  zero specificity, mirroring how the real preflight relies on bare element
  selectors — utility classes still win.
- **Emit the docs utilities unlayered.** Starlight ships a global, unlayered
  reset — `input, button, textarea, select { font: inherit }` — and an unlayered
  rule outranks any `@layer`. If the utilities lived in a cascade layer, that
  reset would override `text-sm` / `font-medium` on every control. Kept unlayered,
  a `.text-sm` (specificity 0,1,0) simply outranks a bare `button` (0,0,1).
- **Reuse Starlight's dark attribute.** Starlight already toggles
  `data-theme="dark"` on the root element, which is exactly what the component
  tokens key off, so the previews follow the docs theme with no extra wiring.
- Preview wrappers also carry Starlight's `not-content` class so the docs content
  styles are stripped inside a demo.

## Consequences

- Token values have a single home (`tokens.css`), shared by the published
  stylesheet, the Tailwind preset and the docs — the manual-sync caveat noted in
  ADR-005 is reduced accordingly.
- The docs deliberately do not import `@sergeyhorse/forge/styles.css`; they
  recompile from source. That is only viable inside this monorepo (the sources are
  on disk) and is specific to the documentation build, not to consumers.
- The scoping was verified empirically in both Starlight themes: the rendered
  Solid button matches Storybook (14px / 500 / 40px height / 8px radius / primary
  fill) while Starlight's own headings and lists keep their styling.
