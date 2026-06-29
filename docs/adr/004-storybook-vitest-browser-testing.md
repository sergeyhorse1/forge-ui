# ADR-004: Story testing via Vitest browser mode

## Status

Accepted

## Context

Stories live alongside the components in `packages/ui` and double as the visual
documentation and the interaction/accessibility test fixtures. Two questions had
to be settled before any component lands:

1. **How are stories executed as tests?** Earlier Storybook releases shipped a
   separate Playwright-based test runner. That runner is gone; story testing now
   runs through the Storybook Vitest addon, which compiles every tagged story
   into a Vitest test and renders it in a real browser. This keeps interaction
   (`play`) and accessibility checks in the same engine the rest of the suite
   uses.

2. **How do browser-mode story tests coexist with plain unit tests?** The
   library already has fast jsdom unit tests for its hooks in `packages/ui`.
   Mixing a real-browser project and a jsdom project in one Vitest run couples
   their lifecycles and slows the common case (running unit tests).

## Decision

- **Two independent Vitest projects, not one workspace file.**
  - `packages/ui/vitest.config.ts` — jsdom, for hooks and utilities.
  - `apps/storybook/vitest.config.ts` — Playwright/Chromium browser mode, for
    stories, wired through the Storybook Vitest addon.
  They never share a runner or a config root, so each can be run and reasoned
  about on its own.
- **The `test` field belongs to the Vitest config, never the Vite config.** The
  Storybook addon owns the test-project definition; declaring `test` in a Vite
  config makes it complain. The browser block (`provider`, `instances`) stays in
  the Vitest config alongside the addon plugin.
- **Tailwind is wired into the Storybook Vite build.** Without the Tailwind Vite
  plugin running in the same build that processes the imported stylesheet, the
  story utility classes resolve to empty rules. The plugin is added in the
  Storybook builder config and the token stylesheet is imported in the preview.
- **Accessibility violations fail tests.** The preview sets `a11y.test = 'error'`
  so the addon turns axe violations into test failures rather than warnings.
- **A post-transform plugin makes the addon's run guard path-robust.** The addon
  guards each generated test with a comparison between `import.meta.url` and the
  worker filepath. Those two strings differ by separator and percent-encoding on
  Windows (and on any host whose project path contains spaces or non-ASCII
  characters), so the guard never matches and tests are silently skipped. A small
  Vite plugin normalises both operands (decode + unify separators) before the
  comparison. It is a no-op where the strings already match.

## Consequences

- Running `pnpm --filter @sergeyhorse/forge test` exercises only the fast jsdom
  project; running `pnpm --filter storybook test` exercises the browser project.
  CI runs both as separate jobs.
- The browser project requires a Chromium download (`playwright install
  chromium`). CI must install it with system dependencies and cache the browser.
- New stories are picked up automatically through the `stories` glob; a story
  opts into the test run via the `test` tag.
- The path-normalisation plugin is a workaround for an upstream limitation. If
  the addon fixes its guard, the plugin can be deleted with no other change.
