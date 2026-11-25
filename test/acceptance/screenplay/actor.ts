import type { Page } from '@playwright/test';
import type { MemberApi } from '../../support/member-api.ts';
import type { Registration } from '../../support/test-member.ts';

/** Something an actor does: a task built from page-object or API calls. */
export type Activity = (actor: Actor) => Promise<void>;

/** What an actor keeps in mind from one step to the next. */
type Notes = {
  readonly registration: Registration;
  readonly sharedPost: string;
};

/**
 * Someone in a scenario. They have two ways into the app: a browser, for the behaviour a
 * scenario is about, and the API, for getting into the state a scenario starts from.
 * Both use the same cookies, so signing in through the API signs the browser in too.
 */
export class Actor {
  readonly name: string;
  readonly browser: Page;
  readonly api: MemberApi;
  readonly #notes = new Map<keyof Notes, unknown>();

  constructor(name: string, browser: Page, api: MemberApi) {
    this.name = name;
    this.browser = browser;
    this.api = api;
  }

  async attemptsTo(...activities: readonly Activity[]): Promise<void> {
    for (const activity of activities) {
      await activity(this);
    }
  }

  remember<Key extends keyof Notes>(key: Key, value: Notes[Key]): void {
    this.#notes.set(key, value);
  }

  recall<Key extends keyof Notes>(key: Key): Notes[Key] {
    if (!this.#notes.has(key)) {
      throw new Error(`${this.name} does not remember any ${key}; an earlier step should have set it`);
    }
    return this.#notes.get(key) as Notes[Key];
  }
}
