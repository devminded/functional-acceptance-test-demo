import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startPostboard } from './postboard.ts';

// The test mailbox lets anyone read anyone's confirmation links, so production must not have it.
test('keeps the test mailbox closed unless a test run switches it on', async (t) => {
  const anna = startPostboard(t, { exposesTestMailbox: false }).visitorCalled('Anna');
  await anna.register(anna.registration);

  await assert.rejects(anna.latestConfirmationLinkFor(anna.registration.email), /expected 200, got 404/);
});
