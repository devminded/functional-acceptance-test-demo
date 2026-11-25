import { createBdd, test as base } from 'playwright-bdd';
import { Cast } from './screenplay/cast.ts';

export const test = base.extend<{ cast: Cast }>({
  cast: async ({ browser, baseURL }, use) => {
    if (baseURL === undefined) {
      throw new Error('Set use.baseURL in playwright.config.ts');
    }
    const cast = new Cast(browser, baseURL);
    await use(cast);
    await cast.dismiss();
  },
});

export const { Given, When, Then } = createBdd(test);
