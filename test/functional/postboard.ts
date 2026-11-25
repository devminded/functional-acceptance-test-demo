import type { TestContext } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { buildApp, SESSION_COOKIE } from '../../src/server/app.ts';
import { Mailbox } from '../../src/server/mailbox.ts';
import { MemberApi } from '../support/member-api.ts';
import { aNewMemberCalled, type Registration } from '../support/test-member.ts';
import type { Transport } from '../support/transport.ts';

const PUBLIC_URL = 'http://postboard.test';

/** Sends requests straight into the app, no network, and keeps one visitor's session cookie. */
function inProcessTransport(app: FastifyInstance): Transport {
  let sessionId: string | undefined;
  return async ({ method, path, body }) => {
    const response = await app.inject({
      method,
      url: path,
      payload: body as Record<string, unknown> | undefined,
      cookies: sessionId === undefined ? {} : { [SESSION_COOKIE]: sessionId },
    });
    const sessionCookie = response.cookies.find((cookie) => cookie.name === SESSION_COOKIE);
    if (sessionCookie !== undefined) {
      sessionId = sessionCookie.value === '' ? undefined : sessionCookie.value;
    }
    const isJson = String(response.headers['content-type'] ?? '').includes('application/json');
    return {
      status: response.statusCode,
      body: isJson ? response.json() : response.body,
      location: response.headers.location as string | undefined,
    };
  };
}

export type Visitor = MemberApi & { readonly registration: Registration };

export type Postboard = {
  /** Someone new with their own session; `registration` is theirs to use, not yet registered. */
  readonly visitorCalled: (name: string) => Visitor;
  /** A member with a confirmed account who is not signed in. */
  readonly memberCalled: (name: string) => Promise<Visitor>;
  /** A confirmed member with a session of their own. */
  readonly signedInMemberCalled: (name: string) => Promise<Visitor>;
};

export type PostboardOptions = { readonly exposesTestMailbox?: boolean };

/** A fresh app for one test, closed when the test ends, so no test sees another's data. */
export function startPostboard(test: TestContext, options: PostboardOptions = {}): Postboard {
  const app = buildApp({
    publicUrl: PUBLIC_URL,
    mailbox: new Mailbox(),
    exposesTestMailbox: options.exposesTestMailbox ?? true,
  });
  test.after(() => app.close());

  const visitorCalled = (name: string): Visitor =>
    Object.assign(new MemberApi(inProcessTransport(app)), { registration: aNewMemberCalled(name) });

  const memberCalled = async (name: string): Promise<Visitor> => {
    const member = visitorCalled(name);
    await member.createConfirmedAccount(member.registration);
    return member;
  };

  const signedInMemberCalled = async (name: string): Promise<Visitor> => {
    const member = await memberCalled(name);
    await member.startSession(member.registration);
    return member;
  };

  return { visitorCalled, memberCalled, signedInMemberCalled };
}
