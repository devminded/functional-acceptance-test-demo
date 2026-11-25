import assert from 'node:assert/strict';
import { test } from 'node:test';
import { greetingFor } from '../../src/web/greeting.ts';

test('greets a member on their first visit as a new member', () => {
  assert.equal(
    greetingFor({ name: 'Anna', isNewMember: true }),
    'Welcome to Postboard, Anna! Glad to have you as a new member.',
  );
});

test('welcomes a returning member back', () => {
  assert.equal(greetingFor({ name: 'Anna', isNewMember: false }), 'Welcome back, Anna!');
});
