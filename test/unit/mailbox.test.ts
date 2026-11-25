import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Mailbox, type Email } from '../../src/server/mailbox.ts';

const anEmail: Email = {
  to: 'anna@example.com',
  subject: 'Confirm your email address',
  body: 'Hi Anna',
  link: 'http://localhost/confirm',
};

test('hands every email it sends to the reader of the outbox', () => {
  const read: Email[] = [];
  new Mailbox((email) => read.push(email)).send(anEmail);
  assert.deepEqual(read, [anEmail]);
});

test('keeps sent emails for their recipient', () => {
  const mailbox = new Mailbox();
  mailbox.send(anEmail);
  assert.deepEqual(mailbox.emailsTo('Anna@Example.com'), [anEmail]);
});
