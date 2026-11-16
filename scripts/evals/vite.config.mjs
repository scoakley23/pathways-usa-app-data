// Only for the evals in scripts/evals/ (run with vite-node, so they can use the
// app's own modules, like src/lib/civicsCheckPrompt.js).
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export default {
  root: ROOT,
  resolve: { alias: { '@': path.join(ROOT, 'src') } },
};
