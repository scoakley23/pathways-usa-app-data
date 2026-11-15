// Only for `npm run translations:sources` (writes content/translations/_sources.json).
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, '../..'),
  resolve: { alias: { '@': path.resolve(__dirname, '../../src') } },
  test: { environment: 'node', include: ['scripts/translations/writeSources.test.js'] },
});
