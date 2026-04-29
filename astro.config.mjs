import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://shivamsharma.dev',
  integrations: [mdx(), sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    ssr: { noExternal: ['three', 'gsap', 'tone'] },
  },
});
