import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aPostAbout } from '../support/test-member.ts';
import { startPostboard } from './postboard.ts';

type Post = { readonly author: string; readonly text: string };

test('shows the timeline only to members who are signed in', async (t) => {
  const visitor = startPostboard(t).visitorCalled('Visitor');

  const response = await visitor.timeline();

  assert.equal(response.status, 401);
});

test('lets only members who are signed in share', async (t) => {
  const visitor = startPostboard(t).visitorCalled('Visitor');

  const response = await visitor.share(aPostAbout('sneaking in'));

  assert.equal(response.status, 401);
});

test('shows other members what a member shared, newest first', async (t) => {
  const postboard = startPostboard(t);
  const anna = await postboard.signedInMemberCalled('Anna');
  const ben = await postboard.signedInMemberCalled('Ben');
  const first = aPostAbout('first walk of the day');
  const second = aPostAbout('second walk of the day');

  await anna.shareOrFail(first);
  await anna.shareOrFail(second);
  const timeline = (await ben.timeline()).body as readonly Post[];

  assert.deepEqual(
    timeline.map(({ author, text }) => ({ author, text })),
    [
      { author: 'Anna', text: second },
      { author: 'Anna', text: first },
    ],
  );
});

test('rejects a post with nothing in it', async (t) => {
  const anna = await startPostboard(t).signedInMemberCalled('Anna');

  const response = await anna.share('   ');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { problems: ['A post needs some text'] });
});
