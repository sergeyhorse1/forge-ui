# ADR-005: Design tokens and Tailwind 4 distribution

## Status

Accepted

## Context

The library is styled with Tailwind 4, which is CSS-first: the theme is declared
inside CSS with `@theme { ... }` rather than in a JavaScript config object as in
Tailwind 3. Consumers fall into two camps:

1. Apps that already run Tailwind and want the design tokens to flow into their
   own build (so `bg-background`, `text-foreground`, `rounded-md`, etc. resolve
   to our values and their custom utilities can reference the same scale).
2. Apps that do not run Tailwind at all and just want a drop-in stylesheet.

Both must observe the same source of truth for tokens, and dark mode has to work
without forcing `dark:` variants onto every element.

## Decision

- **Single source of truth in `src/styles/globals.css`.** All semantic tokens
  (`--color-background`, `--color-foreground`, `--color-primary`,
  `--color-muted`, `--color-border`, `--radius`, …) live in one `@theme` block.
  Colours use the `oklch()` colour space for perceptually-even shades.
- **Dark mode via `data-theme`.** `@variant dark (&:where([data-theme='dark'],
  [data-theme='dark'] *))` re-points the `dark:` variant at a
  `data-theme="dark"` attribute. The dark palette re-declares the same
  `--color-*` custom properties under `[data-theme='dark']`, so toggling the
  attribute swaps every token-backed utility with no per-element variants.
- **Two distribution paths:**
  - **(a) Prebuilt stylesheet.** The build emits `dist/styles.css` (the compiled
    `globals.css`), exposed as `@sergeyhorse/forge/styles.css`. Importing the
    package root also pulls it in as a CSS side effect (see ADR-006). This serves
    camp 2 and is the simplest integration.
  - **(b) Token preset.** `src/styles/preset.ts` exports the same tokens as a
    typed object (`lightTokens`, `darkTokens`, `darkSelector`, and a combined
    `preset`), shipped as `@sergeyhorse/forge/preset`. Because Tailwind 4 has no
    JS preset format, camp 1 inherits tokens by importing the prebuilt CSS into
    their own `@import 'tailwindcss'` entry; the exported object exists for
    programmatic consumers (docs site, token pipelines) that need the values in
    JS without re-declaring them.

## Consequences

- The token values are authored once, in CSS. `preset.ts` mirrors them and a
  comment marks `globals.css` as authoritative; the two must be kept in sync by
  hand. A future improvement could generate one from the other, but the set is
  small and stable enough that manual sync is acceptable for now.
- Dark mode is attribute-driven, which lets an app switch themes per-subtree, not
  just globally, and avoids a flash when the preference is stored server-side.
- Consumers never need a Tailwind config to get the look; running Tailwind is an
  opt-in enhancement, not a requirement.
