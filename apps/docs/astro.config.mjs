// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Forge UI',
      description: 'Accessible, headless-first React components built on Radix and Tailwind.',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/sergeyhorse1/forge-ui',
        },
      ],
      customCss: ['./src/styles/forge.css'],
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Introduction', slug: 'index' },
            { label: 'Installation', slug: 'getting-started/installation' },
          ],
        },
        {
          label: 'Components',
          items: [
            { label: 'Button', slug: 'components/button' },
            { label: 'Input', slug: 'components/input' },
            { label: 'Switch', slug: 'components/switch' },
            { label: 'Dialog', slug: 'components/dialog' },
            { label: 'Combobox', slug: 'components/combobox' },
            { label: 'DataGrid', slug: 'components/data-grid' },
          ],
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
