import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildApp } from './app.ts';
import { Mailbox } from './mailbox.ts';

const DEFAULT_PORT = 3000;
const BUILT_PAGES = fileURLToPath(new URL('../../dist', import.meta.url));

const port = Number(process.env.PORT ?? DEFAULT_PORT);

const app = buildApp({
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${port}`,
  // No real email is sent, so the terminal is the inbox of anyone trying the app.
  mailbox: new Mailbox((email) => console.log(`\nEmail to ${email.to}: ${email.subject}\n  ${email.link}\n`)),
  exposesTestMailbox: process.env.EXPOSE_TEST_MAILBOX === 'true',
  // During `npm run dev:web` there is no build: Vite serves the pages and proxies /api here.
  staticDirectory: existsSync(BUILT_PAGES) ? BUILT_PAGES : undefined,
  logger: true,
});

await app.listen({ port, host: 'localhost' });
