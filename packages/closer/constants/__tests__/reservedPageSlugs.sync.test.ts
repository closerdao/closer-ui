import fs from 'fs';
import path from 'path';

import { APP_ROUTES, CUSTOM_PAGE_APPS } from '../reservedPageSlugs';

const APPS_DIR = path.resolve(__dirname, '../../../../apps');
const API_ROUTES = path.resolve(
  __dirname,
  '../../../../../closer-api/utils/reservedPageSlugs.js',
);

const SKIP_FILES = new Set([
  'index.tsx',
  'index.ts',
  'index.js',
  'sitemap.xml.js',
  '.DS_Store',
]);

const segmentFromEntry = (name: string): string | null => {
  if (name.startsWith('_') || name.startsWith('[') || name.startsWith('.')) {
    return null;
  }
  if (SKIP_FILES.has(name) || name === 'api') return null;
  return name.replace(/\.(tsx|ts|jsx|js)$/, '');
};

const redirectSegments = (configPath: string): string[] => {
  const source = fs.readFileSync(configPath, 'utf8');
  const segments = new Set<string>();
  for (const match of source.matchAll(/source:\s*'([^']+)'/g)) {
    const first = match[1].split('/').filter(Boolean)[0];
    if (first && !first.startsWith(':')) segments.add(first);
  }
  return [...segments];
};

const discoveredRoutes = (): Record<string, string[]> => {
  const apps = fs
    .readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return Object.fromEntries(
    apps.flatMap((app) => {
      const pagesDir = path.join(APPS_DIR, app, 'pages');
      if (!fs.existsSync(pagesDir)) return [];
      const segments = new Set<string>();
      for (const name of fs.readdirSync(pagesDir)) {
        const segment = segmentFromEntry(name);
        if (segment) segments.add(segment);
      }
      const configPath = path.join(APPS_DIR, app, 'next.config.js');
      if (fs.existsSync(configPath)) {
        redirectSegments(configPath).forEach((segment) =>
          segments.add(segment),
        );
      }
      return [[app, [...segments].sort()]];
    }),
  );
};

describe('reserved page routes stay in sync with the apps', () => {
  const found = discoveredRoutes();

  it('matches every app pages directory and redirect', () => {
    const listed = Object.fromEntries(
      Object.entries(APP_ROUTES).map(([app, segments]) => [
        app,
        [...segments].sort(),
      ]),
    );
    expect(listed).toEqual(found);
    const withCustomPages = Object.keys(found)
      .filter((app) =>
        fs.existsSync(path.join(APPS_DIR, app, 'pages', '[slug].tsx')),
      )
      .sort();
    expect([...CUSTOM_PAGE_APPS].sort()).toEqual(withCustomPages);
  });

  // closer-api is a sibling checkout and is not present in closer-ui CI.
  (fs.existsSync(API_ROUTES) ? it : it.skip)(
    'matches the API copy of the same routes',
    () => {
      const api = require(API_ROUTES) as {
        APP_ROUTES: Record<string, string[]>;
      };
      const listed = Object.fromEntries(
        Object.entries(api.APP_ROUTES).map(([app, segments]) => [
          app,
          [...segments].sort(),
        ]),
      );
      const fromUi = Object.fromEntries(
        Object.entries(APP_ROUTES).map(([app, segments]) => [
          app,
          [...segments].sort(),
        ]),
      );
      expect(listed).toEqual(fromUi);
    },
  );
});
