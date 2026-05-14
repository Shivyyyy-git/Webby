import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://shivam.website',
  integrations: [mdx(), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: { noExternal: ['three', 'gsap', 'tone'] },
  },
});
