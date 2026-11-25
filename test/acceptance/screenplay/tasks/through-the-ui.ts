/**
 * Tasks that go through the user interface: the behaviour a scenario is about. They say what the
 * actor does; the page objects know which fields and buttons that takes.
 */
import { expect } from '@playwright/test';
import { aPostAbout } from '../../../support/test-member.ts';
import { HomePage } from '../../pages/home-page.ts';
import { SignInPage } from '../../pages/sign-in-page.ts';
import type { Activity } from '../actor.ts';

const WRONG_PASSWORD = 'not-my-password';

export const register: Activity = async (actor) => {
  const signInPage = new SignInPage(actor.browser);
  await signInPage.open();
  await signInPage.register(actor.recall('registration'));
  // Waits for the server to accept it, so the confirmation email exists before the next step.
  await expect(signInPage.notice).toContainText('Check your inbox');
};

/** Opens the link from the inbox, as the member would. Reading the inbox is the only back door. */
export const confirmEmailAddress: Activity = async (actor) => {
  const link = await actor.api.latestConfirmationLinkFor(actor.recall('registration').email);
  await actor.browser.goto(link);
};

export const signIn: Activity = async (actor) => {
  const signInPage = new SignInPage(actor.browser);
  await signInPage.open();
  await signInPage.signIn(actor.recall('registration'));
};

export const signInWithTheWrongPassword: Activity = async (actor) => {
  const signInPage = new SignInPage(actor.browser);
  await signInPage.open();
  await signInPage.signIn({ ...actor.recall('registration'), password: WRONG_PASSWORD });
};

export const signOut: Activity = async (actor) => {
  const homePage = new HomePage(actor.browser);
  await homePage.open();
  await homePage.signOut();
};

export const visitPostboard: Activity = async (actor) => {
  await new HomePage(actor.browser).open();
};

export const sharePost: Activity = async (actor) => {
  const post = aPostAbout('Lovely day for a walk');
  const homePage = new HomePage(actor.browser);
  await homePage.open();
  await homePage.share(post);
  actor.remember('sharedPost', post);
};
