import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { normalizeEmail, postProblems, registrationProblems } from '../../src/server/validation.ts';

const validRegistration = { name: 'Anna', email: 'anna@example.com', password: 'Secret123' };

describe('registration', () => {
  test('accepts a name, an email address and a long enough password', () => {
    assert.deepEqual(registrationProblems(validRegistration), []);
  });

  test('lists every problem at once', () => {
    assert.deepEqual(registrationProblems({ name: ' ', email: 'anna', password: 'short' }), [
      'Please tell us your name',
      'That does not look like an email address',
      'Your password needs at least 8 characters',
    ]);
  });

  test('ignores surrounding spaces and case in email addresses', () => {
    assert.equal(normalizeEmail('  Anna@Example.COM '), 'anna@example.com');
  });
});

describe('posts', () => {
  test('rejects a post of only whitespace', () => {
    assert.deepEqual(postProblems(' \n '), ['A post needs some text']);
  });

  test('accepts a post of exactly 280 characters and rejects one more', () => {
    assert.deepEqual(postProblems('a'.repeat(280)), []);
    assert.deepEqual(postProblems('a'.repeat(281)), ['A post can be at most 280 characters']);
  });
});
