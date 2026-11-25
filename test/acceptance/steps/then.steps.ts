// A Then checks what the member sees, so most go through the user interface. One checks state
// the page does not show ("still signed out"), and asks the API instead.
import { expect } from '@playwright/test';
import { Then } from '../fixtures.ts';
import { HomePage } from '../pages/home-page.ts';
import { SignInPage } from '../pages/sign-in-page.ts';
import { signIn } from '../screenplay/tasks/through-the-ui.ts';

const NOT_SIGNED_IN = 401;

Then('she/he can sign in', async ({ cast }) => {
  const actor = cast.actorInTheSpotlight();
  await actor.attemptsTo(signIn);
  await expect(new HomePage(actor.browser).greeting).toBeVisible();
});

Then('she/he is greeted as a new member', async ({ cast }) => {
  await expect(new HomePage(cast.actorInTheSpotlight().browser).greeting).toContainText('new member');
});

Then('she/he is welcomed back', async ({ cast }) => {
  await expect(new HomePage(cast.actorInTheSpotlight().browser).greeting).toContainText('Welcome back');
});

Then('she/he is told her/his email address or password is incorrect', async ({ cast }) => {
  const signInPage = new SignInPage(cast.actorInTheSpotlight().browser);
  await expect(signInPage.signInError).toHaveText('Email address or password is incorrect');
});

Then('she/he is still signed out', async ({ cast }) => {
  const session = await cast.actorInTheSpotlight().api.session();
  expect(session.status).toBe(NOT_SIGNED_IN);
});

Then('she/he is asked to sign in', async ({ cast }) => {
  await expect(new SignInPage(cast.actorInTheSpotlight().browser).heading).toBeVisible();
});

Then('her/his post is on the timeline', async ({ cast }) => {
  const actor = cast.actorInTheSpotlight();
  await expect(new HomePage(actor.browser).postWithText(actor.recall('sharedPost'))).toBeVisible();
});

Then('she/he sees the post {word} shared', async ({ cast }, author: string) => {
  const reader = cast.actorInTheSpotlight();
  const post = cast.existingActor(author).recall('sharedPost');
  await expect(new HomePage(reader.browser).postWithText(post)).toBeVisible();
});
