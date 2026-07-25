import type { Plugin } from 'vite'

// Аддон сверяет percent-encoded import.meta.url с нативным путём воркера: на пути с пробелами или кириллицей includes не матчится и стори молча выпадают (vitest#6367)
const GUARD_CALL = 'convertToFilePath(import.meta.url).includes('
const HELPER_NAME = '__forgeNormalizedPath'
const HELPER = `const ${HELPER_NAME} = (value) => { let v = String(value); try { v = decodeURIComponent(v); } catch {} return v.replaceAll("\\\\", "/"); };`

export function windowsStoryGuard(): Plugin {
  return {
    name: 'forge:windows-story-guard',
    enforce: 'post',
    transform(code) {
      if (!code.includes(GUARD_CALL)) return null

      const guarded = code.replaceAll(
        GUARD_CALL,
        `${HELPER_NAME}(convertToFilePath(import.meta.url)).includes(${HELPER_NAME}(`,
      )

      // Флаг /g обязателен: guard-блок генерится на каждую стори, без него уцелеет только первая
      const closed = guarded.replace(/\.testPath\);/g, '.testPath));')

      return `${HELPER}\n${closed}`
    },
  }
}
