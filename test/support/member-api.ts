import { TEST_MAILBOX_PATH } from '../../src/server/app.ts';
import type { Credentials, Registration } from './test-member.ts';
import type { ApiResponse, Transport } from './transport.ts';

type Email = { readonly link: string };

function expectStatus(response: ApiResponse, expected: number, action: string): ApiResponse {
  if (response.status !== expected) {
    throw new Error(
      `Could not ${action}: expected ${expected}, got ${response.status} ${JSON.stringify(response.body)}`,
    );
  }
  return response;
}

/**
 * The app's API as a member uses it. The plain calls return the response, for tests that check
 * how the API answers. The composite steps below are for setting up state: they fail loudly
 * when something goes wrong, so a broken setup never looks like a failing behaviour.
 */
export class MemberApi {
  readonly #send: Transport;

  constructor(send: Transport) {
    this.#send = send;
  }

  register(registration: Registration): Promise<ApiResponse> {
    return this.#send({ method: 'POST', path: '/api/members', body: registration });
  }

  /** Reads the member's inbox through the test mailbox, which only test runs switch on. */
  async latestConfirmationLinkFor(email: string): Promise<string> {
    const response = await this.#send({ method: 'GET', path: `${TEST_MAILBOX_PATH}/${encodeURIComponent(email)}` });
    const emails = expectStatus(response, 200, `read the mailbox of ${email}`).body as readonly Email[];
    const latest = emails.at(-1);
    if (latest === undefined) {
      throw new Error(`No email was sent to ${email}`);
    }
    return latest.link;
  }

  confirm(link: string): Promise<ApiResponse> {
    return this.#send({ method: 'GET', path: new URL(link).pathname });
  }

  signIn(credentials: Credentials): Promise<ApiResponse> {
    return this.#send({ method: 'POST', path: '/api/session', body: credentials });
  }

  session(): Promise<ApiResponse> {
    return this.#send({ method: 'GET', path: '/api/session' });
  }

  signOut(): Promise<ApiResponse> {
    return this.#send({ method: 'DELETE', path: '/api/session' });
  }

  share(text: string): Promise<ApiResponse> {
    return this.#send({ method: 'POST', path: '/api/posts', body: { text } });
  }

  timeline(): Promise<ApiResponse> {
    return this.#send({ method: 'GET', path: '/api/posts' });
  }

  async createConfirmedAccount(registration: Registration): Promise<void> {
    expectStatus(await this.register(registration), 201, `register ${registration.email}`);
    const link = await this.latestConfirmationLinkFor(registration.email);
    expectStatus(await this.confirm(link), 303, `confirm ${registration.email}`);
  }

  async startSession(credentials: Credentials): Promise<void> {
    expectStatus(await this.signIn(credentials), 200, `sign in as ${credentials.email}`);
  }

  async endSession(): Promise<void> {
    expectStatus(await this.signOut(), 204, 'sign out');
  }

  async shareOrFail(text: string): Promise<void> {
    expectStatus(await this.share(text), 201, 'share a post');
  }
}
