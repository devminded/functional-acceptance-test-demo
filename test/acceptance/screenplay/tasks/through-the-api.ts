/**
 * Tasks that put an actor into a state through the API. A scenario's Given only describes where
 * the actor starts, not the behaviour under test, so it gets there the fastest way: milliseconds
 * instead of seconds of clicking. The behaviours themselves are tested elsewhere through their
 * own door: registration and sign-in through the UI in joining.feature and signing-in.feature.
 */
import { aNewMemberCalled, aPostAbout } from '../../../support/test-member.ts';
import type { Activity } from '../actor.ts';

export const haveAnAccount: Activity = async (actor) => {
  const registration = aNewMemberCalled(actor.name);
  await actor.api.createConfirmedAccount(registration);
  actor.remember('registration', registration);
};

export const beSignedIn: Activity = async (actor) => {
  await actor.api.startSession(actor.recall('registration'));
};

export const beSignedOut: Activity = async (actor) => {
  await actor.api.endSession();
};

export const haveSharedAPost: Activity = async (actor) => {
  const post = aPostAbout(`${actor.name} went for a walk`);
  await actor.api.shareOrFail(post);
  actor.remember('sharedPost', post);
};
