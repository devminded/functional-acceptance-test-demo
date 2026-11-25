import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { fastify, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { Email, Mailbox } from './mailbox.ts';
import { Members } from './members.ts';
import { Sessions, type Session } from './sessions.ts';
import { Timeline } from './timeline.ts';
import { postProblems, type Credentials, type Registration } from './validation.ts';

export const SESSION_COOKIE = 'session';
export const SIGN_IN_PAGE = '/sign-in.html';
export const TEST_MAILBOX_PATH = '/api/test/mailbox';

export type AppOptions = {
  /** Where members reach the app; used for links in emails. */
  readonly publicUrl: string;
  readonly mailbox: Mailbox;
  /**
   * Lets tests read sent mail over HTTP. A back door into members' inboxes, so it must only
   * ever be switched on for a test run, never in production.
   */
  readonly exposesTestMailbox: boolean;
  /** The built pages. Left out in functional tests and in development, where Vite serves them. */
  readonly staticDirectory?: string;
  readonly logger?: boolean;
};

const stringField = { type: 'string' } as const;

const registrationSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: { name: stringField, email: stringField, password: stringField },
  },
} as const;

const credentialsSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: { email: stringField, password: stringField },
  },
} as const;

const postSchema = {
  body: { type: 'object', required: ['text'], properties: { text: stringField } },
} as const;

function problems(...messages: readonly string[]): { problems: readonly string[] } {
  return { problems: messages };
}

function confirmationEmail(name: string, to: string, link: string): Email {
  return {
    to,
    subject: 'Confirm your email address',
    body: `Hi ${name}, open this link to confirm your email address: ${link}`,
    link,
  };
}

export function buildApp(options: AppOptions): FastifyInstance {
  const app = fastify({ logger: options.logger ?? false });
  const members = new Members();
  const sessions = new Sessions();
  const timeline = new Timeline();

  app.register(cookie);

  const sessionOf = (request: FastifyRequest): Session | undefined =>
    sessions.find(request.cookies[SESSION_COOKIE]);

  // Answers 401 itself when nobody is signed in; the caller then only has to return the reply.
  const requireSession = (request: FastifyRequest, reply: FastifyReply): Session | undefined => {
    const session = sessionOf(request);
    if (session === undefined) {
      reply.code(401).send(problems('Please sign in first'));
    }
    return session;
  };

  app.post<{ Body: Registration }>('/api/members', { schema: registrationSchema }, async (request, reply) => {
    const outcome = await members.register(request.body);
    switch (outcome.kind) {
      case 'invalid':
        return reply.code(400).send(problems(...outcome.problems));
      case 'email-taken':
        return reply.code(409).send(problems('There is already an account with this email address'));
      case 'registered': {
        const link = new URL(`/api/confirmations/${outcome.confirmationToken}`, options.publicUrl).href;
        options.mailbox.send(confirmationEmail(outcome.name, outcome.email, link));
        return reply.code(201).send();
      }
    }
  });

  // A GET with a side effect, because it is opened from a link in an email.
  app.get<{ Params: { token: string } }>('/api/confirmations/:token', async (request, reply) => {
    if (!members.confirm(request.params.token)) {
      return reply.code(404).send(problems('This confirmation link is not valid'));
    }
    return reply.redirect(`${SIGN_IN_PAGE}?confirmed`, 303);
  });

  app.post<{ Body: Credentials }>('/api/session', { schema: credentialsSchema }, async (request, reply) => {
    const outcome = await members.signIn(request.body);
    switch (outcome.kind) {
      case 'wrong-credentials':
        return reply.code(401).send(problems('Email address or password is incorrect'));
      case 'unconfirmed':
        return reply.code(403).send(problems('Please confirm your email address before signing in'));
      case 'signed-in': {
        const session = { name: outcome.name, email: outcome.email, isNewMember: outcome.isNewMember };
        reply.setCookie(SESSION_COOKIE, sessions.start(session), {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          secure: options.publicUrl.startsWith('https:'),
        });
        return { name: session.name, isNewMember: session.isNewMember };
      }
    }
  });

  app.get('/api/session', async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === undefined) {
      return reply;
    }
    return { name: session.name, isNewMember: session.isNewMember };
  });

  app.delete('/api/session', async (request, reply) => {
    sessions.end(request.cookies[SESSION_COOKIE]);
    return reply.clearCookie(SESSION_COOKIE, { path: '/' }).code(204).send();
  });

  app.get('/api/posts', async (request, reply) => {
    if (requireSession(request, reply) === undefined) {
      return reply;
    }
    return timeline.newestFirst();
  });

  app.post<{ Body: { text: string } }>('/api/posts', { schema: postSchema }, async (request, reply) => {
    const session = requireSession(request, reply);
    if (session === undefined) {
      return reply;
    }
    const postIssues = postProblems(request.body.text);
    if (postIssues.length > 0) {
      return reply.code(400).send(problems(...postIssues));
    }
    const post = { author: session.name, text: request.body.text.trim(), sharedAt: new Date().toISOString() };
    timeline.share(post);
    return reply.code(201).send(post);
  });

  if (options.exposesTestMailbox) {
    app.get<{ Params: { address: string } }>(`${TEST_MAILBOX_PATH}/:address`, async (request) =>
      options.mailbox.emailsTo(request.params.address),
    );
  }

  if (options.staticDirectory !== undefined) {
    app.register(fastifyStatic, { root: options.staticDirectory });
  }

  return app;
}
