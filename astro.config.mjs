// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  site: 'https://saintgian.github.io',
  base: '/KUBOLAB',
  integrations: [svelte()]
});