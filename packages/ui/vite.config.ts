import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), dts({ bundleTypes: true, tsconfigPath: './tsconfig.json' })],
  build: {
    lib: {
      // preset отдельным энтри, чтобы токены тянулись без остального бандла
      entry: {
        index: 'src/index.ts',
        preset: 'src/styles/preset.ts',
      },
      formats: ['es'],
    },
    sourcemap: true,
    rollupOptions: {
      // Рантайм-зависимости тоже наружу (ADR-006): иначе в dist уедут хешированные пути node_modules и пропадёт дедуп у консьюмера
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^radix-ui($|\/)/,
        'lucide-react',
        'date-fns',
        /^date-fns\//,
        'clsx',
        'tailwind-merge',
        'class-variance-authority',
        '@tanstack/react-virtual',
        'react-day-picker',
        /^react-day-picker\//,
        'cmdk',
        /^cmdk\//,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
        // Имя без хеша, иначе `./styles.css` из exports-карты не зарезолвится
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((name) => name.endsWith('.css'))
            ? 'styles.css'
            : '[name]-[hash][extname]',
      },
    },
  },
})
