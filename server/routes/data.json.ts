// Nitro server route: serves local portfolio data in development.
// In production the data is fetched from /portfolio/data.json (CDN).
// This mirrors the Vite dev middleware in the other framework ports.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export default defineEventHandler(() => {
  const dataPath = resolve(process.cwd(), '../../data/entries.json');
  if (!existsSync(dataPath)) {
    throw createError({ statusCode: 404, message: 'Local data not found' });
  }
  const body = readFileSync(dataPath, 'utf8');
  return JSON.parse(body);
});
