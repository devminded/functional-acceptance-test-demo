// During `npm run dev:web`, Vite serves every source file of the pages at its own path and
// proxies the API paths to the server. A proxy path that also matches a source file sends that
// file to the API, which answers 404, and the page breaks only in development: the built pages
// bundle their modules, so the acceptance tests never notice.
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { test } from 'node:test';
import config from '../../vite.config.ts';

const PAGES = new URL('../../src/web/', import.meta.url);

test('proxies no source file of the pages to the API', () => {
  const proxiedPaths = Object.keys(config.server?.proxy ?? {});
  const sourcePaths = readdirSync(PAGES).map((file) => `/${file}`);
  for (const proxied of proxiedPaths) {
    // Vite matches a proxy key as a path prefix.
    assert.deepEqual(
      sourcePaths.filter((path) => path.startsWith(proxied)),
      [],
      `${proxied} is proxied to the API`,
    );
  }
});
