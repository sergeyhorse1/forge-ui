// Guards the published stylesheet on two fronts:
//
//  1. It must still carry the load-bearing component utilities. The Tailwind
//     content scan is configured in globals.css; if that scope ever breaks, the
//     emitted CSS quietly drops to a handful of token rules and every consumer
//     renders an unstyled grid — something the unit and story tests do not catch.
//
//  2. It must NOT carry demo, preview, story or test classes. globals.css scopes
//     the scan to the published directories precisely so these never leak; this
//     check fails loudly if a stray `@source` (or a demo file moved under a
//     scanned path) starts bloating the bundle again.
//
// Run after `vite build`. It reads dist/styles.css and asserts both invariants.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const STYLESHEET = fileURLToPath(new URL('../dist/styles.css', import.meta.url))

// Emitted only when the published component sources are scanned. `overflow-auto`
// also clips the virtualizer overscan, so its presence is doubly load-bearing.
const REQUIRED_CLASSES = ['overflow-auto', 'truncate', 'ring-ring', 'bg-muted']

// Emitted only by demo harnesses, the token-preview gallery or stories. None of
// these files are exported from the package entry, so their classes must never
// reach the published CSS.
const FORBIDDEN_CLASSES = ['grid-cols-2', 'font-mono', 'max-w-prose', 'min-h-svh']

function fail(message) {
  console.error(`verify-dist-styles: ${message}`)
  process.exit(1)
}

let css
try {
  css = readFileSync(STYLESHEET, 'utf8')
} catch {
  fail(`dist/styles.css not found at ${STYLESHEET}; run \`pnpm build\` first`)
}

const missing = REQUIRED_CLASSES.filter((name) => !css.includes(`.${name}`))
if (missing.length > 0) {
  fail(
    `component utilities missing from dist/styles.css: ${missing.join(', ')} — ` +
      'the Tailwind content scan is not reaching the component sources',
  )
}

const leaked = FORBIDDEN_CLASSES.filter((name) => css.includes(`.${name}`))
if (leaked.length > 0) {
  fail(
    `demo/preview classes leaked into dist/styles.css: ${leaked.join(', ')} — ` +
      'the content scan in globals.css is no longer scoped to published code',
  )
}

console.log(
  'verify-dist-styles: ok — component utilities present, ' +
    'no demo/preview classes leaked',
)
