import type { Locator, Page } from '@playwright/test';

export class HomePage {
  static readonly path = '/';

  readonly greeting: Locator;
  readonly #page: Page;
  readonly #timeline: Locator;
  readonly #shareForm: Locator;

  constructor(page: Page) {
    this.#page = page;
    this.greeting = page.getByRole('heading', { level: 1 });
    this.#timeline = page.getByRole('list', { name: 'Timeline' });
    this.#shareForm = page.getByRole('form', { name: 'Share a post' });
  }

  async open(): Promise<void> {
    await this.#page.goto(HomePage.path);
  }

  postWithText(text: string): Locator {
    return this.#timeline.getByRole('listitem').filter({ hasText: text });
  }

  async share(text: string): Promise<void> {
    await this.#shareForm.getByLabel("What's on your mind?").fill(text);
    await this.#shareForm.getByRole('button', { name: 'Share' }).click();
  }

  async signOut(): Promise<void> {
    await this.#page.getByRole('button', { name: 'Sign out' }).click();
  }
}
