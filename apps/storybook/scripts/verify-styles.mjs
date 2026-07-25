// Content-scan Tailwind якорится на build-root, поэтому исходники пакета подключены явным @source: сломается, и CSS молча схлопнется до правил декоратора
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSETS_DIR = fileURLToPath(
  new URL('../storybook-static/assets', import.meta.url),
)

const REQUIRED_CLASSES = [
  'overflow-auto',
  'bg-muted',
  'truncate',
  'border-border',
  'text-muted-foreground',
]

// Билд без пакета выпускает около шести правил декоратора, здоровый заметно больше сорока
const MIN_RULE_COUNT = 40

function fail(message) {
  console.error(`verify-styles: ${message}`)
  process.exit(1)
}

let cssFiles
try {
  cssFiles = readdirSync(ASSETS_DIR).filter((name) => name.endsWith('.css'))
} catch {
  fail(`assets directory not found at ${ASSETS_DIR}; run \`storybook build\` first`)
}

if (cssFiles.length === 0) fail('no CSS asset was emitted by the build')

// storybook-static между билдами не чистится, так что рядом лежат несколько хешированных стилей
const newest = cssFiles
  .map((name) => {
    const path = join(ASSETS_DIR, name)
    return { name, path, mtime: statSync(path).mtimeMs }
  })
  .sort((a, b) => b.mtime - a.mtime)[0]

const css = readFileSync(newest.path, 'utf8')

const missing = REQUIRED_CLASSES.filter(
  (className) => !css.includes(`.${className}`),
)
if (missing.length > 0) {
  fail(
    `component utilities missing from ${newest.name}: ${missing.join(', ')} — ` +
      'the Tailwind content scan is not reaching the component package',
  )
}

const ruleCount = (css.match(/\{/g) ?? []).length
if (ruleCount < MIN_RULE_COUNT) {
  fail(
    `only ${ruleCount} CSS rules in ${newest.name} (expected > ${MIN_RULE_COUNT}); ` +
      'the component package is likely not being scanned',
  )
}

console.log(
  `verify-styles: ok — ${ruleCount} rules, all required classes present in ${newest.name}`,
)
