import type { APIRequestContext, Browser, BrowserContext } from '@playwright/test';
import { MemberApi } from '../../support/member-api.ts';
import type { Transport } from '../../support/transport.ts';
import { Actor } from './actor.ts';

/** Sends API calls through the actor's browser context, so API and browser share cookies. */
function browserContextTransport(request: APIRequestContext): Transport {
  return async ({ method, path, body }) => {
    const response = await request.fetch(path, { method, data: body, maxRedirects: 0 });
    const isJson = (response.headers()['content-type'] ?? '').includes('application/json');
    return {
      status: response.status(),
      body: isJson ? await response.json() : await response.text(),
      location: response.headers()['location'],
    };
  };
}

/**
 * The actors of one scenario. Each gets a browser context of their own, so two actors never
 * share a session. Steps that say "she" or "he" mean the actor named most recently.
 */
export class Cast {
  readonly #browser: Browser;
  readonly #baseURL: string;
  readonly #actors = new Map<string, Actor>();
  readonly #contexts: BrowserContext[] = [];
  #spotlight: Actor | undefined;

  constructor(browser: Browser, baseURL: string) {
    this.#browser = browser;
    this.#baseURL = baseURL;
  }

  async actorCalled(name: string): Promise<Actor> {
    const actor = this.#actors.get(name) ?? (await this.#newActor(name));
    this.#spotlight = actor;
    return actor;
  }

  /** An actor an earlier step introduced, without moving the spotlight to them. */
  existingActor(name: string): Actor {
    const actor = this.#actors.get(name);
    if (actor === undefined) {
      throw new Error(`No earlier step introduced ${name}`);
    }
    return actor;
  }

  actorInTheSpotlight(): Actor {
    if (this.#spotlight === undefined) {
      throw new Error('No actor has been named yet; a step must name one before "she" or "he"');
    }
    return this.#spotlight;
  }

  async dismiss(): Promise<void> {
    await Promise.all(this.#contexts.map((context) => context.close()));
  }

  async #newActor(name: string): Promise<Actor> {
    const context = await this.#browser.newContext({ baseURL: this.#baseURL });
    this.#contexts.push(context);
    const actor = new Actor(name, await context.newPage(), new MemberApi(browserContextTransport(context.request)));
    this.#actors.set(name, actor);
    return actor;
  }
}
