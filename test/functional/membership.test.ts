import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startPostboard } from './postboard.ts';

test('sends a newcomer a link to confirm her email address', async (t) => {
  const anna = startPostboard(t).visitorCalled('Anna');

  const response = await anna.register(anna.registration);

  assert.equal(response.status, 201);
  assert.match(await anna.latestConfirmationLinkFor(anna.registration.email), /\/api\/confirmations\/\S+$/);
});

test('rejects a registration for an address that already has an account, whatever its case', async (t) => {
  const anna = await startPostboard(t).memberCalled('Anna');

  const response = await anna.register({ ...anna.registration, email: anna.registration.email.toUpperCase() });

  assert.equal(response.status, 409);
});

test('rejects a registration with a short password and says why', async (t) => {
  const anna = startPostboard(t).visitorCalled('Anna');

  const response = await anna.register({ ...anna.registration, password: 'short' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { problems: ['Your password needs at least 8 characters'] });
});

test('keeps a newcomer out until she confirms her email address', async (t) => {
  const anna = startPostboard(t).visitorCalled('Anna');
  await anna.register(anna.registration);

  const response = await anna.signIn(anna.registration);

  assert.equal(response.status, 403);
});

test('sends a confirmed member to the sign-in page', async (t) => {
  const anna = startPostboard(t).visitorCalled('Anna');
  await anna.register(anna.registration);

  const response = await anna.confirm(await anna.latestConfirmationLinkFor(anna.registration.email));

  assert.equal(response.status, 303);
  assert.equal(response.location, '/sign-in.html?confirmed');
});

test('accepts a confirmation link only once', async (t) => {
  const anna = startPostboard(t).visitorCalled('Anna');
  await anna.register(anna.registration);
  const link = await anna.latestConfirmationLinkFor(anna.registration.email);
  await anna.confirm(link);

  const response = await anna.confirm(link);

  assert.equal(response.status, 404);
});

test('treats the first sign-in as that of a new member', async (t) => {
  const anna = await startPostboard(t).memberCalled('Anna');

  const response = await anna.signIn(anna.registration);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { name: 'Anna', isNewMember: true });
});

test('welcomes a member back on later sign-ins', async (t) => {
  const anna = await startPostboard(t).signedInMemberCalled('Anna');
  await anna.endSession();

  const response = await anna.signIn(anna.registration);

  assert.deepEqual(response.body, { name: 'Anna', isNewMember: false });
});

test('rejects a wrong password without revealing whether the account exists', async (t) => {
  const postboard = startPostboard(t);
  const anna = await postboard.memberCalled('Anna');
  const stranger = postboard.visitorCalled('Stranger');

  const wrongPassword = await anna.signIn({ ...anna.registration, password: 'not-the-password' });
  const unknownAccount = await stranger.signIn(stranger.registration);

  assert.equal(wrongPassword.status, 401);
  assert.deepEqual(unknownAccount, wrongPassword);
});

test('ends the session when a member signs out', async (t) => {
  const anna = await startPostboard(t).signedInMemberCalled('Anna');

  await anna.signOut();

  assert.equal((await anna.session()).status, 401);
});
