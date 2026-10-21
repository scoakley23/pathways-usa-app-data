import { defineConfig } from 'vitest/config';
import path from 'path';

// Separate from vite.config.js so tests don't need the Base44 plugin or env.
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
