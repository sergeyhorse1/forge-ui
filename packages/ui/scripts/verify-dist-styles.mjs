// Скоуп content-scan из globals.css рвётся молча: юнит- и стори-тесты не заметят ни пропавших утилит, ни протёкших классов демок
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const STYLESHEET = fileURLToPath(new URL('../dist/styles.css', import.meta.url))

// overflow-auto ещё и обрезает overscan виртуализатора, так что его пропажа бьёт дважды
const REQUIRED_CLASSES = ['overflow-auto', 'truncate', 'ring-ring', 'bg-muted']

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
