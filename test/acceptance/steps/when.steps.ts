// Every When is the behaviour under test, so every When goes through the user interface.
import { When } from '../fixtures.ts';
import {
  confirmEmailAddress,
  register,
  sharePost,
  signIn,
  signInWithTheWrongPassword,
  signOut,
  visitPostboard,
} from '../screenplay/tasks/through-the-ui.ts';

When('she/he registers', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(register);
});

When('she/he confirms her/his email address', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(confirmEmailAddress);
});

When('she/he signs in', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(signIn);
});

When('she/he signs in with the wrong password', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(signInWithTheWrongPassword);
});

When('she/he signs out', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(signOut);
});

When('she/he visits Postboard', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(visitPostboard);
});

When('she/he shares a post', async ({ cast }) => {
  await cast.actorInTheSpotlight().attemptsTo(sharePost);
});
