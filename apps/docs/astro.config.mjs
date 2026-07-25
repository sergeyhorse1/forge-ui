// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://sergeyhorse1.github.io',
  base: '/forge-ui',
  integrations: [
    starlight({
      title: 'Forge UI',
      description: 'Accessible, headless-first React components built on Radix and Tailwind.',
      favicon: '/favicon.svg',
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
            {
              label: 'Base',
              items: [
                { label: 'Button', slug: 'components/button' },
                { label: 'Badge', slug: 'components/badge' },
                { label: 'Avatar', slug: 'components/avatar' },
                { label: 'Card', slug: 'components/card' },
                { label: 'IconButton', slug: 'components/icon-button' },
                { label: 'Spinner', slug: 'components/spinner' },
                { label: 'Skeleton', slug: 'components/skeleton' },
                { label: 'Tooltip', slug: 'components/tooltip' },
              ],
            },
            {
              label: 'Forms',
              items: [
                { label: 'Input', slug: 'components/input' },
                { label: 'Textarea', slug: 'components/textarea' },
                { label: 'Select', slug: 'components/select' },
                { label: 'Checkbox', slug: 'components/checkbox' },
                { label: 'Radio', slug: 'components/radio' },
                { label: 'Switch', slug: 'components/switch' },
                { label: 'Combobox', slug: 'components/combobox' },
                { label: 'DatePicker', slug: 'components/date-picker' },
              ],
            },
            {
              label: 'Overlays',
              items: [
                { label: 'Dialog', slug: 'components/dialog' },
                { label: 'Popover', slug: 'components/popover' },
                { label: 'Sheet', slug: 'components/sheet' },
                { label: 'Toast', slug: 'components/toast' },
              ],
            },
            {
              label: 'Data & dashboard',
              items: [
                { label: 'DataGrid', slug: 'components/data-grid' },
                { label: 'MetricCard', slug: 'components/metric-card' },
                { label: 'KpiGrid', slug: 'components/kpi-grid' },
                { label: 'EmptyState', slug: 'components/empty-state' },
                { label: 'Tabs', slug: 'components/tabs' },
                { label: 'Accordion', slug: 'components/accordion' },
                { label: 'Toolbar', slug: 'components/toolbar' },
                { label: 'Pagination', slug: 'components/pagination' },
              ],
            },
            {
              label: 'Advanced',
              items: [
                { label: 'FilterBuilder', slug: 'components/filter-builder' },
                { label: 'CommandMenu', slug: 'components/command-menu' },
              ],
            },
          ],
        },
        {
          label: 'Storybook',
          link: '/storybook/',
          attrs: { target: '_blank' },
        },
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
