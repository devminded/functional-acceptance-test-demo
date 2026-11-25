// Every Given describes a state, so every Given goes through the API.
import { aNewMemberCalled } from '../../support/test-member.ts';
import { Given } from '../fixtures.ts';
import { beSignedIn, beSignedOut, haveAnAccount, haveSharedAPost } from '../screenplay/tasks/through-the-api.ts';

Given('{word} has never had an account with us', async ({ cast }, name: string) => {
  const actor = await cast.actorCalled(name);
  actor.remember('registration', aNewMemberCalled(name));
});

Given('{word} is not signed in', async ({ cast }, name: string) => {
  // A new actor has a browser of their own with no cookies: nobody is signed in there.
  await cast.actorCalled(name);
});

Given('{word} is a member', async ({ cast }, name: string) => {
  const actor = await cast.actorCalled(name);
  await actor.attemptsTo(haveAnAccount);
});

Given('{word} is a member who has signed in before', async ({ cast }, name: string) => {
  const actor = await cast.actorCalled(name);
  await actor.attemptsTo(haveAnAccount, beSignedIn, beSignedOut);
});

Given('{word} is signed in', async ({ cast }, name: string) => {
  const actor = await cast.actorCalled(name);
  await actor.attemptsTo(haveAnAccount, beSignedIn);
});

Given('{word} has shared a post', async ({ cast }, name: string) => {
  const actor = await cast.actorCalled(name);
  await actor.attemptsTo(haveAnAccount, beSignedIn, haveSharedAPost);
});
